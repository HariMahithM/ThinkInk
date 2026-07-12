const NoData = ({ msg = "No data found" }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fi fi-rr-inbox text-6xl text-dark-grey opacity-50 mb-5"></i>
            <p className="text-xl text-dark-grey">{msg}</p>
        </div>
    );
};

export default NoData;