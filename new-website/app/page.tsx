const Homepage: React.FC = () => {
  return (
    <div className="bg-blue-50 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <header className="text-center py-10">
          <h1 className="text-4xl font-bold text-blue-900">
            Welcome to Dataset Colab
          </h1>
          <p className="text-blue-600">
            The ultimate platform for discovering, sharing, and collaborating on
            datasets across various domains.
          </p>
        </header>
        <section className="py-10">
          <h2 className="text-3xl font-bold text-blue-900">
            Why Dataset Colab?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-blue-900">
                Discover & Access
              </h5>
              <p className="font-normal text-gray-700">
                Gain access to a vast repository of datasets, curated for
                quality and relevance.
              </p>
            </div>
            <div className="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-blue-900">
                Contribute & Collaborate
              </h5>
              <p className="font-normal text-gray-700">
                Share your datasets and collaborate with the community to
                enhance research and innovation.
              </p>
            </div>
            <div className="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-blue-900">
                Tools & Analytics
              </h5>
              <p className="font-normal text-gray-700">
                Leverage advanced tools for dataset analysis and visualization
                to drive insights.
              </p>
            </div>
          </div>
        </section>
        <div className="flex justify-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg mr-4">
            Explore Repositories (Datasets + Models)
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg">
            Join the Community
          </button>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
