import { useForm, type SubmitHandler } from "react-hook-form";
import "./App.css";
import { useState, type JSX } from "react";
import Button from "./button";

type FormData = {
  username: string;
  email: string;
  password: string;
};

type AuthUser = {
  id: string;
  username: string;
  email: string;
  balance: number;
  created_at: string;
};

type RegisterProps = {
  isOpen: boolean;
  onClose: () => void;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  onRegisterSuccess: (token: string, user: AuthUser) => void;
};

function Register({
  isOpen,
  onClose,
  backgroundColor,
  textColor,
  fontSize,
  onRegisterSuccess,
}: RegisterProps): JSX.Element {
  const [errorMessage, setErrorMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseBody?.error || "Registration failed");
      }

      onRegisterSuccess(responseBody.token, responseBody.user);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Registration failed"
      );
    }
  };

  if (!isOpen) return <></>;

  return (
    <div className="modal-overlay">
      <div
        className="modal-box"
        style={{
          backgroundColor,
          width: "400px",
          height: "400px",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          borderRadius: "10px",
          border: "4px solid #DA291C",
          position: "relative",
          justifyContent: "flex-start"
        }}
      >
        <>
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-start" }}>
        <Button
          backgroundColor="#ffffff"
          textColor="00000"
          fontSize={30}
          pillShape
          onClick={onClose}
        >
            ×
          </Button>
          </div>

        <h2 style={{ textAlign: "center", fontFamily: "Futura, sans-serif" }}>
          Sign up to gamble today!
        </h2>

          {errorMessage && (
            <span style={{ color: "red", fontSize: "14px" }}>{errorMessage}</span>
          )}

          <form className="App" onSubmit={handleSubmit(onSubmit)}>
            <input
              type="text"
              {...register("username", { required: true })}
              placeholder="Username"
            />
            {errors.username && (
              <span style={{ color: "red" }}>*Username* is mandatory</span>
            )}

            <input
              type="email"
              {...register("email", { required: true })}
              placeholder="Email"
            />
            {errors.email && (
              <span style={{ color: "red" }}>*Email* is mandatory</span>
            )}

            <input
              type="password"
              {...register("password", { required: true, minLength: 8 })}
              placeholder="Password"
            />
            {errors.password && (
              <span style={{ color: "red" }}>
                *Password* must be at least 8 characters
              </span>
            )}

          <Button
            backgroundColor="#DA291C"
            textColor="white"
            pillShape
            fontSize={20}
            onClick={handleSubmit(onSubmit)}
          >
            Sign up
          </Button>
          </form>
        </>
      </div>
    </div>
  );
}

export default Register;
