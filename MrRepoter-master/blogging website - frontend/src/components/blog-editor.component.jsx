import EditorJS from "@editorjs/editorjs";
import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import defaultBanner from "../imgs/blog banner.png";
import logo from "../imgs/log.png";
import nature1 from "../imgs/nature1.jpeg";
import nature2 from "../imgs/nature2.jpg";
import nature3 from "../imgs/nature3.jpg";
import nature4 from "../imgs/nature4.jpg";
import nature5 from "../imgs/nature5.jpg";
import politics1 from "../imgs/politics1.png";
import politics2 from "../imgs/politics2.jpg";
import politics3 from "../imgs/politics3.jpg";
import politics4 from "../imgs/politics4.png";
import politics5 from "../imgs/politics5.jpg";
import sports1 from "../imgs/sports1.jpg";
import sports2 from "../imgs/sports2.jpg";
import sports3 from "../imgs/sports3.jpg";
import sports4 from "../imgs/sports4.jpg";
import sports5 from "../imgs/sports5.jpg";
import { EditorContext } from "../pages/editor.pages";
import { tools } from "./tools.component";



const BlogEditor =() => {

    const categoryImages = {
        sports: [sports1, sports2, sports3, sports4, sports5],
        politics: [politics1, politics2, politics3, politics4, politics5],
        nature: [nature1, nature2, nature3, nature4, nature5],
    };

    let blogBannerRef = useRef();
    let { blog, blog: {title,banner,content,target,tags,des},setBlog, textEditor,setTextEditor,setEditorState} = useContext(EditorContext)

    let { userAuth : {access_token} } = useContext(UserContext)

    let navigate = useNavigate()

    //use Effect
    useEffect(()=>{
        if(!textEditor.isReady && !textEditor.instance){
            const editor = new EditorJS({
                holderId: "textEditor",
                data: content,
                tools: tools,
                placeholder: "Share your story",
                onReady: () => {
                    setTextEditor({ isReady: true, instance: editor });
                }
            });
        }
        
    }, [])

    const handleBannerUpload = (e) =>{
        let img = e.target.files[0];
        if(img){
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                setBannerImage(base64);
                setBlog({...blog, banner: base64});
            };
            reader.readAsDataURL(img);
        }
    }

    const handleTitleKeyDown = (e) =>{
        if(e.keyCode == 13){
            e.preventDefault();
        }
    }

    const handleTitleChange = (e) =>{
        let input = e.target;
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + "px";

        setBlog({...blog, title:input.value})
    }

    const handleError = (e) =>{
        let img = e.target;
        //img src = defaultBanner;
    }

    const [bannerImage, setBannerImage] = useState(defaultBanner);
    const handleCategorySelection = (category) => {
        const selectedImages = categoryImages[category];
        const randomImage = selectedImages[Math.floor(Math.random() * selectedImages.length)];
        setBannerImage(randomImage); 
        setBlog({ ...blog, banner: randomImage });
    };

    const handlePublishEvent = () =>{
        if (!banner.length) {
            console.log("working");
            toast.error("Upload a blog banner to publish", { position: "top-right" }); // Add position here
            return;
        }
        if (!title.length) {
            console.log("working");
            toast.error("Your blog title is empty", { position: "top-right" }); // Add position here
            return;
        }
        if(textEditor.isReady && textEditor.instance){
            textEditor.instance.save().then(data => {
                if(data.blocks.length){
                    setBlog({...blog, content: data })
                    setEditorState("publish")
                }else{
                    return toast.error("Write Content")
                }
            })
            .catch((err) => {
                console.log(err);
            })
        }

    }
    const handleSaveDraft = (e) => {

        if(e.target.className.includes("disable")){
            return;
        }
        if(!title.length){
            toast.error("You must provide title for saving draft")
            return;
        }

        let loadingToast = toast.loading("Saving Draft...");
        e.target.classList.add('disable');

        const saveDraft = (contentData) => {
            const blogObj = {
                title, 
                banner, 
                des: des || '', 
                content: contentData || blog.content || { blocks: [] }, 
                tags: blog.tags || [], 
                draft: true,
                ...(blog.blog_id ? { blog_id: blog.blog_id } : {})
            };

            const request = blog.blog_id 
                ? axios.put(import.meta.env.VITE_SERVER_DOMAIN + "/update-blog", blogObj, { headers: { 'Authorization': `Bearer ${access_token}` } })
                : axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", blogObj, { headers: { 'Authorization': `Bearer ${access_token}` } });
                
            request
            .then((response)=>{
                e.target.classList.remove('disable');
                toast.dismiss(loadingToast);
                toast.success("Saved");
                // If it's a new blog, set the blog_id so future saves are updates
                if(!blog.blog_id && response.data.id){
                    setBlog(prev => ({...prev, blog_id: response.data.id}));
                }
            })
            .catch(({response})=>{
                e.target.classList.remove('disable'); 
                toast.dismiss(loadingToast);
                toast.error(response?.data?.error || "Something went wrong") 
            })
        }

        if(textEditor.isReady && textEditor.instance){
            textEditor.instance.save().then(content => saveDraft(content)).catch(() => saveDraft(null));
        } else {
            saveDraft(null);
        }
    }
    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-11">
                    <img src={logo}/>
                </Link>
                <p className="max-md:hidden text-white line-clamp-1 w-full">
                    { title.length ? title : "New Blog"}
                </p>
                <div className="flex gap-4 ml-auto">
                    <button className="btn-dark py-2"
                    onClick={handlePublishEvent}>
                        Publish
                    </button>
                    <button className="btn-light py-2" onClick={handleSaveDraft}>
                        Save Draft
                    </button>
                </div>
            </nav>


                <section>
                    <div className="mx-auto max-w-[900px] w-full">
                    <div className="p-4 text-center flex gap-4 ml-auto">
            <button 
                    onClick={() => handleCategorySelection("sports")}
                    className="btn-dark py-1"
                    >
                    Sports
                    </button>
                    <button 
                    onClick={() => handleCategorySelection("politics")}
                    className="btn-dark py-1"
                    >
                    Politics
                    </button>
                    <button 
                    onClick={() => handleCategorySelection("nature")}
                    className="btn-dark py-1"
                    >
                    Nature
                    </button>
                </div>

                {/* Banner Section */}
                <div className="relative aspect-video hover:opacity-80 bg-black border-4 border-grey">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleBannerUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                    />
                    <img src={bannerImage} className="z-20 w-full h-full object-cover" alt="Selected banner" />
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50 text-white text-lg pointer-events-none">
                        <i className="fi fi-sr-cloud-upload mr-2"></i> Click to upload banner
                    </div>
                </div>
                    
                        <textarea 
                        defaultValue={title}
                        placeholder="Blog Title" className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 text-white bg-transparent"
                        onKeyDown={handleTitleKeyDown}
                        onChange={handleTitleChange}></textarea>

                        <hr className="w-full opacity-10 my-5"/>

                        <div id="textEditor" className="font-gelasio"></div>

                    </div>
                </section>

        </>
        
    )
}


export default BlogEditor;

