import useRegisterForm from "../../../hooks/useRegisterForm";
import Link from "next/link";

const FormError = ({ message }: { message: string | undefined }) => {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
};

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {children}
  </div>
);

const SubmitButton = ({
  isLoading,
  text,
}: {
  isLoading: boolean;
  text: string;
}) => (
  <button
    type="submit"
    disabled={isLoading}
    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
  >
    {isLoading ? "Creating account..." : text}
  </button>
);

const RegisterForm = () => {
  const { error, errors, isLoading, register, handleSubmit, password } =
    useRegisterForm();

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 p-3 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <FormField label="Email Address">
          <input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                message: "Invalid email address",
              },
            })}
            type="email"
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
            placeholder="Enter your email"
          />
          <FormError message={errors.email?.message} />
        </FormField>

        <FormField label="Full Name">
          <input
            {...register("name", {
              required: "Name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            })}
            type="text"
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
            placeholder="Enter your full name"
          />
          <FormError message={errors.name?.message} />
        </FormField>

        <FormField label="Password">
          <input
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
            type="password"
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
            placeholder="Create a password"
          />
          <FormError message={errors.password?.message} />
        </FormField>

        <FormField label="Confirm Password">
          <input
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
            type="password"
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
            placeholder="Confirm your password"
          />
          <FormError message={errors.confirmPassword?.message} />
        </FormField>
      </div>

      <div className="text-sm text-gray-600">
        <p>By signing below you agree to the terms of use and privacy notice</p>
      </div>

      <SubmitButton isLoading={isLoading} text="Sign Up" />

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Already have an account? Login
        </Link>
      </div>
    </form>
  );
};

export default RegisterForm;
