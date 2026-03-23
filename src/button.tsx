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
            borderRadius: pillShape ? "999px" : "4px",
            padding: "10px 16px",
            cursor: "pointer",
        }}>
            {children}
        </button>
    );
}