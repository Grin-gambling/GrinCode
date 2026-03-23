type ButtonProps = {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    pillShape?: boolean;
    children: React.ReactNode;
};

export default function Button({
    backgroundColor,
    textColor,
    fontSize,
    pillShape,
    children,
}: ButtonProps) {
    return (
        <button style={{
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