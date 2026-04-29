import { useForm, type SubmitHandler } from "react-hook-form";
import "./App.css";
import { useState, type JSX } from "react";
import Button from "./button";

type FormData = {
  name: string;
  email: string;
  password: string;
};

type UserData = {
  name: string;
  email: string;
  password: string;
};

type RegisterProps = {
    isOpen: boolean;
    onClose: () => void;
    backgroundColor: string;
    textColor: string;
    fontSize: number;
  };

  function Register({
    isOpen, 
    onClose,
    backgroundColor,
    textColor,
    fontSize,
  }: RegisterProps): JSX.Element {
    const [errorMessage, setErrorMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const existingUser = localStorage.getItem(data.email);

    if (existingUser) {
        setErrorMessage("An account with that email already exists.");
    } else {
      const userData: UserData = {
        name: data.name,
        email: data.email,
        password: data.password,
      };

      localStorage.setItem(data.email, JSON.stringify(userData));
      console.log(`${data.name} has been successfully registered`);
      onClose();
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
    justifyContent: "space-between"
  }}
>
    <>

      <Button
        backgroundColor = "Black"
        textColor={textColor}
        fontSize={fontSize}
        pillShape
        onClick={onClose}
        >
            X
      </Button>

      <h2>Registration Form</h2>

                  {errorMessage && (
                      <span style={{ color: "red", fontSize: "14px" }}>{errorMessage}</span>
                  )}


      <form className="App" onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          {...register("name", { required: true })}
          placeholder="Name"
        />
        {errors.name && (
          <span style={{ color: "red" }}>*Name* is mandatory</span>
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
          {...register("password", { required: true })}
          placeholder="Password"
        />
        {errors.password && (
          <span style={{ color: "red" }}>*Password* is mandatory</span>
        )}

        <input
          type="submit"
          style={{ backgroundColor: "#a1eafb" }}
        />
      </form>
    </>
    </div>
    </div>
  );
}

export default Register;