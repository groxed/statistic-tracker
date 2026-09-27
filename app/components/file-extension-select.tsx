import { FileExtension } from "../constants";

type FileExtensionSelectProps = {
	fileExtension: FileExtension;
	onFileExtensionSelect: (value: FileExtension) => void;
};

export const FileExtensionSelect = ({
	fileExtension: value,
	onFileExtensionSelect,
}: FileExtensionSelectProps) => {
	return (
		<select
			value={value}
			onChange={(e) => onFileExtensionSelect(e.target.value as FileExtension)}
		>
			{[FileExtension.CSV, FileExtension.XLSX].map((extension) => (
				<option key={extension} value={extension}>
					{extension}
				</option>
			))}
		</select>
	);
};
