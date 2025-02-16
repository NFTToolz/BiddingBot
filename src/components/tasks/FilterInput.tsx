const FilterInput: React.FC<{
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ placeholder, value, onChange }) => {
  return (
    <div className="relative w-full min-w-44">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-lg border border-[#3F3A52] bg-[#2C2C35] text-[#9691A4]"
      />
    </div>
  );
};

export default FilterInput;
