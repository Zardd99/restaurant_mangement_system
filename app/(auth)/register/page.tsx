"use client";

import RegisterForm from "../../presentation/components/RegisterForm/RegisterForm";

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Registration
          </h2>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
