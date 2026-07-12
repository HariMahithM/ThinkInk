import bcrypt from 'bcrypt';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import serviceAccountKey from "./mrrepoter-blogger-firebase-adminsdk-o591e-a844a040e0.json" with { type: 'json' };


import Blog from './Schema/Blog.js';
import User from './Schema/User.js';

const server = express();
let PORT = 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
})

const verifyJWT = (req,res,next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(token == null){
        return res.status(401).json({error:"No access token"})
    }
    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err,user) =>{
        if(err){
            return res.status(403).json({error:"Access token is invalid"})
        }
        req.user = user.id
        next()
    })
}

const formatDatatoSend = (user) =>{
    const access_token = jwt.sign({ id: user._id}, process.env.SECRET_ACCESS_KEY)
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    }
}

const generateUsername = async (email) => {
    let username = email.split("@")[0];
    let isUsernameExists = await User.exists({"personal_info.username" : username}).then((result) => result)
    isUsernameExists ? username += nanoid().substring(0, 5) : "";
    return username
}

server.post("/signup", (req, res) => {
    let { fullname, email, password } = req.body;
    //validate data
    if(fullname.length < 3){
        return res.status(403).json({"error" : "Fullname must be atleast 3 letters long"})
    }
    if(!email.length){
        return res.status(403).json({"error":"Enter Email"})
    }
    if(!emailRegex.test(email)){
        return res.status(403).json({"error":"Email is invalid"})
    }
    if(!passwordRegex.test(password)){
        return res.status(403).json({"error":"Password should 6-20 letter long and with one upper and lower case"})
    }

    bcrypt.hash(password, 10, async (err,hashed_password)=>{
        let username = await generateUsername(email);

        let user = new User({
            personal_info: { fullname, email, password:hashed_password, username}
        })

        user.save().then((u) => {
            return res.status(200).json(formatDatatoSend(u))
        })
        .catch(err =>{
            if(err.code == 11000){
                return res.status(500).json({"error":"Email already exists"})
            }
            return res.status(500).json({"error":err.message})
        })

    })

})

server.post("/signin", (req, res) => {
    let { email, password } = req.body;
    
    User.findOne({ "personal_info.email" : email }).then((user) =>{
        if(!user){
            return res.status(403).json({"error":"Email not found"})
        }
        
        bcrypt.compare(password, user.personal_info.password, (err,result)=>{
            if(err){
                return res.status(403).json({"error":"Error occured while login please try again"})
            }
            if(!result){
                return res.status(403).json({"error":"Incorrect Password"})
            }
            else{
                return res.status(200).json(formatDatatoSend(user))
            }
        })

    })
    .catch(err=>{
        console.log(err.message);
        return res.status(500).json({"error":err.message})
    })
})

server.post("/google-auth", async (req,res) =>{
    let { access_token } = req.body;
    getAuth()
    .verifyIdToken(access_token).then(async (decodedUser) =>{
        let { email,name,picture } = decodedUser;
        let user = await User.findOne({"personal_info.email":email}).select("personal_info.fullname personal_info.username google_auth")
        .then((u) => {
            return u || null
        })
        .catch(err =>{
            return res.status(500).json({"error":err.message})
        })

        if(user){
            if(!user.google_auth){
                return res.status(403).json({"error":"Thsi email was signedup without google.Please log in with password and user id"})
            }
        }
        else{
            let username = await generateUsername(email);
            user= new User({
                personal_info: {fullname: name, email,username}
                ,google_auth: true
            })
            await user.save().then((u) =>{
                user = u;
            })
            .catch(err => {
                return res.status(500).json({ "error": err.message})
            })
        }
        return res.status(200).json(formatDatatoSend(user))
    })
    
})



server.get('/latest-blogs',(req,res)=>{
    let maxLimit = 5;
    Blog.find({ draft: false })
    .populate("author","personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .limit(maxLimit)
    .then(blogs =>{
        return res.status(200).json({ blogs })
    }).catch(err => {
        return res.status(500).json({error: err.message})
    })
})

server.get("/trending-blogs",(req,res)=>{
    Blog.find({ draft: false})
    .populate("author","personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "activity.total_read":-1, "activity.total_likes":-1,"publishedAt": -1})
    .select("blog_id title publishedAt -_id")
    .limit(5)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => {
        return res.status(500).json({error:err.message})
    })
})

server.post('/create-blog', verifyJWT, (req,res)=>{
    let authorId = req.user;
    let { title, des, banner, tags, content, draft} = req.body;
    if(!title.length){
        return res.status(403).json({error:"You must provide title"})
    }
    if(!draft){
        if(!des.length || des.length >200){
            return res.status(403).json({error:"You must provide blog desc"})
        }
        if(!banner.length){
            return res.status(403).json({error:"You must provide blog banner"})
        }
        if(!content.blocks.length){
            return res.status(403).json({error:"no content to publish"})
        }
        if(!tags.length || tags.length > 10){
            return res.status(403).json({error:"enter tags"})
        }
    }
    
    

    tags = tags.map(tag => tag.toLowerCase());

    let blog_id = title.replace(/[^a-zA-Z0-9]/g,' ').replace(/\s+/g,"-").trim() + nanoid();
    console.log(blog_id);

    let blog = new Blog({
        title,des,banner,content,tags,author: authorId,blog_id,draft: Boolean(draft)
    })
    blog.save().then(blog => {
        let incrementVal = draft ? 0 : 1;
        User.findOneAndUpdate({ _id: authorId}, { $inc: {"account_info.total_posts": incrementVal}, $push : { "blogs":blog._id}})
        .then(user => {
            return res.status(200).json({id: blog.blog_id})
        })
        .catch(err =>{
            return res.status(500).json({error:"failed to update post number"})
        })
    })
    .catch(err =>{
        return res.status(500).json({error: err.message})
    })


})

server.post("/get-blog", (req, res) => {
    let { blog_id, draft, mode } = req.body;
    let incrementVal = mode !== "edit" ? 1 : 0;
    Blog.findOneAndUpdate({ blog_id }, { $inc: { "activity.total_reads": incrementVal } })
        .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
        .select("title des content banner activity publishedAt blog_id tags draft")
        .then(blog => {
            if (!blog) {
                return res.status(404).json({ error: "Blog not found" });
            }
            if (!draft && blog.draft) {
                return res.status(404).json({ error: "Blog not found" });
            }
            User.findOneAndUpdate({"personal_info.username": blog.author.personal_info.username },{
                $inc : {"account_info.total_reads" :incrementVal }
            })
            .catch(err => {
                console.log(err.message);
            })

            return res.status(200).json({ blog });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
});

// Like/unlike blog
server.post("/like-blog", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { blog_id, is_liked } = req.body;
    
    let incrementVal = is_liked ? -1 : 1;

    Blog.findOneAndUpdate({ blog_id }, { $inc: { "activity.total_likes": incrementVal } })
    .then(blog => {
        if(!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        
        let updateQuery = is_liked 
            ? { $pull: { liked_blogs: blog._id } } 
            : { $addToSet: { liked_blogs: blog._id } };
            
        User.findOneAndUpdate({ _id: user_id }, updateQuery)
        .then(() => {
            return res.status(200).json({ liked_by_user: !is_liked });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })
})

// Check if user liked blog
server.post("/isliked-by-user", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { blog_id } = req.body;
    
    User.findOne({ _id: user_id })
    .then(user => {
        Blog.findOne({ blog_id })
        .then(blog => {
            if(!blog) {
                return res.status(404).json({ error: "Blog not found" });
            }
            let is_liked = user.liked_blogs.includes(blog._id);
            return res.status(200).json({ is_liked });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })
})

// Search blogs
server.get("/search", (req, res) => {
    let { query } = req.query;
    
    Blog.find({
        draft: false,
        $or: [
            { title: { $regex: query, $options: "i" } },
            { des: { $regex: query, $options: "i" } },
            { tags: { $in: [new RegExp(query, "i")] } }
        ]
    })
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "activity.total_reads": -1, "activity.total_likes": -1, "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .then(blogs => {
        return res.status(200).json({ blogs });
    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })
})

// Get all blogs with pagination
server.post("/all-blogs", (req, res) => {
    let { page, tag, query, author, limit, eliminate_blog } = req.body;
    
    let maxLimit = limit || 5;
    
    let findQuery = { draft: false };
    
    if(tag) {
        findQuery.tags = tag;
    }
    if(query) {
        findQuery.$or = [
            { title: { $regex: query, $options: "i" } },
            { des: { $regex: query, $options: "i" } },
        ];
    }
    if(author) {
        findQuery.author = author;
    }
    if(eliminate_blog) {
        findQuery.blog_id = { $ne: eliminate_blog };
    }
    
    Blog.find(findQuery)
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({ blogs });
    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })
})


// Get user's blogs/drafts
server.get("/user-blogs", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { draft } = req.query;
    let findQuery = { author: user_id };
    if(draft !== undefined) {
        findQuery.draft = draft === 'true';
    }
    Blog.find(findQuery)
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt draft -_id")
    .then(blogs => {
        return res.status(200).json({ blogs });
    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })
})

// Update blog/draft
server.put("/update-blog", verifyJWT, (req, res) => {
    let authorId = req.user;
    let { blog_id, title, des, banner, tags, content, draft } = req.body;

    if(!blog_id) {
        return res.status(400).json({ error: "Blog ID is required" });
    }
    if(!title.length) {
        return res.status(403).json({ error: "You must provide title" });
    }
    
    let updateData = { 
        title,
        draft: Boolean(draft),
    };
    if(des) updateData.des = des;
    if(banner) updateData.banner = banner;
    if(tags) updateData.tags = tags.map(tag => tag.toLowerCase());
    if(content) updateData.content = content;

    Blog.findOneAndUpdate(
        { blog_id, author: authorId },
        updateData,
        { new: true }
    )
    .then(blog => {
        if(!blog) {
            return res.status(404).json({ error: "Blog not found or not authorized" });
        }
        return res.status(200).json({ id: blog.blog_id });
    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })
})

server.listen(PORT, () =>{
    console.log("listening to port->"+ PORT)
})