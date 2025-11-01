import "./Error.css";
function Error() {

    return <>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
                    <h1 className="text-3xl font-bold text-primary text-center mb-8">Error</h1>
                    <div className="space-y-8">
                        <div className="flex-col gap-4 w-full flex items-center justify-center">
                          <div
                            className="w-20 h-20 border-4 border-transparent text-blue-950 text-4xl animate-spin flex items-center justify-center border-t-blue-950 rounded-full">
                            <div
                              className="w-16 h-16 border-4 border-transparent text-blue-400 text-2xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full"
                            ></div>
                          </div>
                        </div>
            <div className="space-y-8">
                <a href="login">
                    <button className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium">
                        Go to the login page
                    </button>
                </a>
                </div>
                </div>
            </div>
        </div>
    </>
}

export default Error