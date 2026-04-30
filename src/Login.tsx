import { useForm, type SubmitHandler } from "react-hook-form";
import "./App.css";
import { useState, type JSX } from "react";
import Button from "./button";

type LoginFormData = {
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

type LoginProps = {
  isOpen: boolean;
  onClose: () => void;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  onLoginSuccess: (token: string, user: AuthUser) => void;
};

function Login({
  isOpen,
  onClose,
  backgroundColor,
  textColor,
  fontSize,
  onLoginSuccess,
}: LoginProps): JSX.Element {
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseBody?.error || "Login failed");
      }

      onLoginSuccess(responseBody.token, responseBody.user);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Login failed"
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
          position: "relative",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Button
            backgroundColor="BLACK"
            textColor={textColor}
            fontSize={fontSize}
            pillShape
            onClick={onClose}
          >
            X
          </Button>
        </div>

        <h2>Login Form</h2>

        {errorMessage && (
          <span style={{ color: "red", fontSize: "14px" }}>{errorMessage}</span>
        )}

        <form className="App" onSubmit={handleSubmit(onSubmit)}>
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
            {...register("password", { required: true })}
            placeholder="Password"
          />
          {errors.password && (
            <span style={{ color: "red" }}>*Password* is mandatory</span>
          )}

          <input
            type="submit"
            value={isSubmitting ? "Logging in..." : "Login"}
            style={{ backgroundColor: "#a1eafb" }}
          />
        </form>
      </div>
    </div>
  );
}

export default Login;
