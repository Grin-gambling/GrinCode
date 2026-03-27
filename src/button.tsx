type ButtonProps = {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    pillShape?: boolean;
    children: React.ReactNode;
    // hoverColor?: string;
    onClick?: () => void;
};

export default function Button({
    backgroundColor,
    textColor,
    fontSize,
    pillShape,
    children,
    // hoverColor,
    onClick,
}: ButtonProps) {
    return (
        <button 
            onClick={onClick}
            style={{
            backgroundColor: backgroundColor,
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