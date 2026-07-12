import Embed from "@editorjs/embed";
import Header from "@editorjs/header";
import Image from "@editorjs/image";
import InlineCode from "@editorjs/inline-code";
import List from "@editorjs/list";
import Marker from "@editorjs/marker";
import Quote from "@editorjs/quote";

const uploadImageByUrl = async (url) => {
    console.log("uploadByUrl called", url);

    return {
        success: 1,
        file: {
            url: url,
        },
    };
};

const uploadImageByFile = async (file) => {
    console.log("uploadByFile called", file);

    return {
        success: 1,
        file: {
            url: URL.createObjectURL(file),
        },
    };
};


export const tools = {
    embed: Embed,
    list:{
        class: List,
        inlineToolbar: true
    },
    header: {
        class: Header,
        config: {
            placeholder: "Type Heading....",
            levels: [2,3],
            defaultLevel: 2
        }
    },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadImageByUrl,
                uploadByFile: uploadImageByFile
            }
        }
    },
    quote: {
        class: Quote,
        inlineToolbar: true
    },
    marker: Marker,
    inlineCode: InlineCode 
}