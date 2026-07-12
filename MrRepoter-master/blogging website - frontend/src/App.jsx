import { createContext, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { lookInSession } from "./common/session";
import Navbar from "./components/navbar.component";
import BlogPage from "./pages/blog.page";
import Editor from "./pages/editor.pages";
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page";
import UserAuthForm from "./pages/userAuthForm.page";

export const UserContext = createContext({})

const App = () => {
    const [userAuth, setUserAuth] = useState({});

    useEffect(()=>{
        let userInSession = lookInSession("user");
        userInSession ? setUserAuth(JSON.parse(userInSession)) : setUserAuth({access_token: null})
    }, [])
    
    return (
        <UserContext.Provider value={{userAuth, setUserAuth}}>
            <Routes>
                <Route path="/editor" element ={<Editor />}/>
                <Route path="/" element={<Navbar />}>
                    <Route index element={<HomePage/>}/>
                    <Route path="/signin" element={<UserAuthForm type="sign-in"/>}/>   
                    <Route path="/signup" element={<UserAuthForm type="sign-up"/>}/>
                    <Route path="blog/:blog_id" element={<BlogPage />}/>
                    <Route path="/search" element={<SearchPage />}/>
                </Route>
            </Routes>
        </UserContext.Provider>
    )
}

export default App;