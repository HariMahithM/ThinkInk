import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BlogPostCard from "../components/blog-post.component";
import Loader from "../components/loader.component";
import NoData from "../components/nodata.component";

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q");
    const [blogs, setBlogs] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSearchResults = () => {
        if (!query) {
            setBlogs([]);
            setLoading(false);
            return;
        }
        axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/search?query=${encodeURIComponent(query)}`)
        .then(({ data }) => {
            setBlogs(data.blogs);
            setLoading(false);
        })
        .catch(err => {
            console.log(err);
            setBlogs([]);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchSearchResults();
    }, [query]);

    return (
        <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            <div className="accent-line" />
            <h1 className="text-2xl sm:text-3xl font-gelasio mb-10 text-white">
                Results for <span className="text-purple">"{query}"</span>
            </h1>
            {loading ? (
                <Loader />
            ) : blogs && blogs.length > 0 ? (
                blogs.map((blog, i) => (
                    <BlogPostCard key={i} content={blog} author={blog.author} />
                ))
            ) : (
                <NoData msg="No blogs found" />
            )}
        </div>
    );
};

export default SearchPage;