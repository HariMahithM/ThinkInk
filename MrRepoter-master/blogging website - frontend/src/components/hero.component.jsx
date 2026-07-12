import { useEffect, useRef, useState } from "react";
import astronaut from "../imgs/astronaut.png";
import bgStars from "../imgs/bg1.png";

const HeroSection = () => {
    const [offsetY, setOffsetY] = useState(0);
    const frameRef = useRef();

    useEffect(() => {
        const start = performance.now();

        const animate = (now) => {
            const elapsed = (now - start) / 1000;
            const y = Math.sin(elapsed * (Math.PI / 5)) * 20;
            setOffsetY(y);
            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    const scrollToStories = () => {
        document
            .getElementById("latest-blogs")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    return (
    <section className="relative h-[calc(100vh-80px)] overflow-hidden bg-black">    
        {/* Background */}
            <img
                src={bgStars}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30"></div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-[#0a0a0a] z-10"></div>

            {/* Content */}
            <div className="relative z-20 h-full flex flex-col-reverse md:flex-row items-center justify-center md:justify-between px-6 md:px-20">

                {/* Astronaut */}
                <div
                    className="w-[70%] sm:w-[55%] md:w-[42%] lg:w-[36%] flex justify-center"
                    style={{
                        transform: `translateY(${offsetY}px)`,
                    }}
                >
                    <img
                        src={astronaut}
                        alt="Astronaut"
                        className="w-full drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)] select-none pointer-events-none"
                    />
                </div>

                {/* Text */}
                <div className="text-center md:text-right max-w-xl mb-8 md:mb-0">
                    <h1
                        className="font-['Permanent_Marker'] uppercase leading-tight text-white"
                        style={{
                            fontSize: "clamp(2.5rem,7vw,6rem)",
                        }}
                    >
                        Every Story
                        <br />
                        Matters
                    </h1>

                    <p className="mt-6 text-gray-300 text-base md:text-xl leading-8">
                        Discover magical adventures, thrilling mysteries,
                        inspiring journeys, and unforgettable stories written
                        by people around the world.
                    </p>

                    <button
                        onClick={scrollToStories}
                        className="mt-8 bg-purple hover:bg-purple/80 text-white rounded-full px-8 py-3 text-lg transition"
                    >
                        Read Stories
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;