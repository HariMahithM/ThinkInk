import axios from "axios";
import { useEffect, useState } from "react";
import BlogPostCard from "../components/blog-post.component";
import HeroSection from "../components/hero.component";
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";

const HomePage = () => {
    let [blogs, setBlog] = useState(null);
    let [trendingblogs, settrendingBlog] = useState(null);
    let [pageState, setPageState] = useState("home");

    let categories = [
    "Fantasy",
    "Sci-Fi",
    "Romance",
    "Adventure",
    "Drama",
    "Children",
    "Mystery",
    "Horror",
    "Thriller",
    "Art"
];
    const fetchlatestBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs")
        .then(({ data }) => {
            setBlog(data.blogs);
        })
        .catch(err => {
            console.log(err);
        })
    }

    const fetchtrendingBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
        .then(({ data }) => {
            settrendingBlog(data.blogs);
        })
        .catch(err => {
            console.log(err);
        })
    }
    const filterBlogsByCategory = (category) => {
    axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs")
        .then(({ data }) => {
            const filteredBlogs = data.blogs.filter(blog =>
                blog.tags?.some(tag =>
                    tag.toLowerCase() === category.toLowerCase()
                )
            );

            setBlog(filteredBlogs);
        })
        .catch(err => console.log(err));
}
    const loadBlogByCategory = (e) => {
    const category = e.target.innerText.toLowerCase();

    if (pageState === category) {
        setPageState("home");
        fetchlatestBlogs();
        return;
    }

    setPageState(category);
    filterBlogsByCategory(category);
}

    useEffect(() => {
        fetchlatestBlogs();
        fetchtrendingBlogs();
    }, [])

    return (
        <>
            <HeroSection />

            <section id="latest-blogs" className="h-cover flex justify-center gap-10">
                {/* Latest Blog */}
                <div className="w-full">
                    <InPageNavigation routes={["home", "trending blogs"]} defaultHidden={["trending blogs"]}>
                        <>
                            {
                                blogs == null ? <Loader /> :
                                blogs.map((blog, i) => {
                                    return <div key={i}>
                                        <BlogPostCard content={blog} author={blog.author.personal_info} />
                                    </div>
                                })
                            }
                        </>
                        {
                            trendingblogs == null ? <Loader /> :
                            trendingblogs.map((blog, i) => {
                                return <div key={i}>
                                    <MinimalBlogPost blog={blog} index={i} />
                                </div>
                            })
                        }
                    </InPageNavigation>
                </div>

                {/* Sidebar */}
                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-white/[0.06] pl-8 pt-5 max-md:hidden">
                    <div className="flex flex-col gap-12">
                        <div>
                            <div className="accent-line" />
                            <h1 className="font-gelasio font-medium text-xl mb-6 text-white">Stories from all interests</h1>
                            <div className="flex gap-3 flex-wrap">
                                {
                                    categories.map((category, i) => {
                                        return (
                                            <button
                                                onClick={loadBlogByCategory}
                                                className={"tag" + (pageState == category ? " active" : "")}
                                                key={i}
                                            >
                                                {category}
                                            </button>
                                        )
                                    })
                                }
                            </div>
                        </div>

                        <div>
                            <div className="accent-line" />
                            <h1 className="font-gelasio font-medium text-xl mb-6 text-white flex items-center gap-2">
                                Trending
                                <i className="fi fi-br-arrow-trend-up text-[#e8b96a] text-lg"></i>
                            </h1>
                            <div className="flex flex-col gap-1">
                                {
                                    trendingblogs == null ? <Loader /> :
                                    trendingblogs.map((blog, i) => {
                                        return <div key={i} className="flex gap-4 items-start card card-hover p-3 mb-2">
                                            <span className="rank-number">{String(i + 1).padStart(2, "0")}</span>
                                            <MinimalBlogPost blog={blog} index={i} />
                                        </div>
                                    })
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default HomePage;