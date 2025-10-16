import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const useRegisterForm = () => {
  const [error, setError] = useState<string>("");
  const { register: registerUser, isLoading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>();

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError("");
      const { confirmPassword, ...userData } = data;
      await registerUser(userData);
      router.push("/user_interface");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  return {
    error,
    errors,
    isLoading,
    register,
    handleSubmit: handleSubmit(onSubmit),
    password,
  };
};

export default useRegisterForm;
