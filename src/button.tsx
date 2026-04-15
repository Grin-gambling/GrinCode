type ButtonProps = {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    pillShape?: boolean;
    children: React.ReactNode;
    width?: string;
    topMargin?: string;
    
    // hoverColor?: string;
    onClick?: () => void;
};

export default function Button({
    backgroundColor,
    textColor,
    fontSize,
    pillShape,
    children,
    width = "auto",
    topMargin,
    // hoverColor,
    onClick,
}: ButtonProps) {
    return (
        <button 
            onClick={onClick}
            style={{
            marginTop: topMargin,  //remember to use px
            backgroundColor: backgroundColor,
            width,
            color: textColor,
            fontSize: fontSize,
            fontFamily: "Futura, sans-serif",
            borderRadius: pillShape ? "999px" : "4px",
            padding: "10px 16px",
            border: "none", // removes blue outline when hovering
            cursor: "pointer",
            outline: "none" // removes blue outline when hover
        }}>
            {children}
        </button>
    );
}