const Page = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-white">
            <input
                type="text"
                className="px-4 py-2 border border-gray-300 rounded-md bg-white"
                placeholder="Enter your name"
            />
            <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
            >
                Submit
            </button>
        </div>
    );
};

export default Page;
