import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";

const BlogInteraction = ({ blog_id, activity }) => {
    const { userAuth, userAuth: { access_token } } = useContext(UserContext);
    const [liked, setLiked] = useState(false);
    const [totalLikes, setTotalLikes] = useState(activity?.total_likes || 0);

    const checkIfLiked = () => {
        if (!access_token) return;
        
        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/isliked-by-user`, { blog_id }, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        })
        .then(({ data }) => {
            setLiked(data.is_liked);
        })
        .catch(err => {
            console.log(err);
        });
    };

    const handleLike = () => {
        if (!access_token) {
            alert("Please sign in to like blogs");
            return;
        }

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/like-blog`, { blog_id, is_liked: liked }, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        })
        .then(({ data }) => {
            setLiked(data.liked_by_user);
            setTotalLikes(prev => data.liked_by_user ? prev + 1 : prev - 1);
        })
        .catch(err => {
            console.log(err);
        });
    };

    useEffect(() => {
        checkIfLiked();
    }, []);

    return (
        <div className="flex gap-5 items-center py-5 border-t border-grey mt-10">
            <button
                onClick={handleLike}
                className={`flex items-center gap-2 ${liked ? "text-red-500" : "text-dark-grey"} hover:opacity-80`}
            >
                <i className={liked ? "fi fi-sr-heart text-2xl" : "fi fi-rr-heart text-2xl"}></i>
                <span className="text-lg">{totalLikes}</span>
            </button>
            <div className="flex items-center gap-2 text-dark-grey">
                <i className="fi fi-rr-eye text-2xl"></i>
                <span className="text-lg">{activity?.total_reads || 0}</span>
            </div>
        </div>
    );
};

export default BlogInteraction;