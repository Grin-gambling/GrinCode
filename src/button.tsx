type ButtonProps = {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    pillShape?: boolean;
    children: React.ReactNode;
    width?: string;
    topMargin?: string;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    ariaLabel?: string;  // ← add this
  };
  
  export default function Button({
    backgroundColor,
    textColor,
    fontSize,
    pillShape,
    children,
    width = "auto",
    topMargin,
    type = "button",
    onClick,
    ariaLabel,  // ← add this
  }: ButtonProps) {
    return (
      <button
        onClick={onClick}
        type={type}
        aria-label={ariaLabel}  // ← add this
        style={{
          marginTop: topMargin,
          backgroundColor: backgroundColor,
          width,
          color: textColor,
          fontSize: fontSize,
          fontFamily: "Futura, sans-serif",
          borderRadius: pillShape ? "999px" : "4px",
          padding: "10px 16px",
          border: "none",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {children}
      </button>
    );
  }