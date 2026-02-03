import React from "react";

interface LoadingPageProps {
  loadingText?: string;
}

const LoadingPage = ({ loadingText = "Loading..." }: LoadingPageProps) => {
  return (
    <div className="bg-white text-black h-screen w-screen text-xl flex justify-center items-center">
      {loadingText}
    </div>
  );
};

export default LoadingPage;