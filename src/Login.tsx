import { useForm, type SubmitHandler } from "react-hook-form";
import "./App.css";
import { useState, type JSX } from "react";
import Button from './button';

type LoginFormData = {
  email: string;
  password: string;
};

type UserData = {
  name: string;
  email: string;
  password: string;
};

type LoginProps = {
  isOpen: boolean;
  onClose: () => void;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  onLoginSuccess: (name: string) => void;
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
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = (data) => {
    const storedUser = localStorage.getItem(data.email);

    if (storedUser) {
      const userData: UserData = JSON.parse(storedUser);

      if (userData.password === data.password) {
        console.log(`${userData.name} You Are Successfully Logged In`);
        onLoginSuccess(userData.name);
      } else {
        setErrorMessage("Email or password is incorrect.");  
      }
    } else {
      setErrorMessage("No account found with that email."); 
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
    height: "350px",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    borderRadius: "10px",
    border: "4px solid #DA291C",
    position: "relative",
    justifyContent: "flex-start"
  }}
>
        <div>
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
          Welcome back!
        </h2>


              {errorMessage && (
                  < span style={{ color: "red", fontSize: "14px" }}>{errorMessage}</span>
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

          <Button
            backgroundColor="#DA291C"
            textColor="white"
            pillShape
            fontSize={20}
            onClick={handleSubmit(onSubmit)}
          >
            Log in
          </Button>
        </form>
      </div>
      </div>
  );
}

export default Login;