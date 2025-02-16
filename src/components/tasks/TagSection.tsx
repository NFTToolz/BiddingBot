import React from "react";
import TagSelect from "./TagSelect";
import PlusIcon from "@/assets/svg/PlusIcon";
import { TaskFormState } from "@/hooks/useTaskForm";
import CustomColorPicker from "./CustomColorPicker";

const TagSection = ({
  formState,
  handleTagChange,
  showCreateTag,
  setShowCreateTag,
  newTagName,
  setNewTagName,
  newTagColor,
  setNewTagColor,
  handleAddTag,
}: ITagSection) => {
  return (
    <div className="mt-6">
      <label htmlFor="tags" className="block text-sm font-medium mb-2">
        Select Tags
      </label>
      <TagSelect
        selectedTags={formState.tags}
        onChange={(tags) => handleTagChange(tags)}
      />
      <button
        type="button"
        className="text-sm text-[#7364DB] mt-0.5 ml-2 block italic cursor-pointer"
        onClick={() => setShowCreateTag(!showCreateTag)}
      >
        {showCreateTag ? "" : "create tag"}
      </button>

      {showCreateTag && (
        <div className="mt-6">
          <h3 className="text-sm">Create New Tag</h3>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Tag Name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="p-2  border-[#1F2128] bg-[#2C2C35] rounded placeholder:text-sm flex-1"
            />
            <CustomColorPicker value={newTagColor} onChange={setNewTagColor} />

            <button type="button" onClick={handleAddTag}>
              <PlusIcon width="40" height="40" />
            </button>
          </div>

          <button
            type="button"
            className="text-sm text-[#7364DB] mt-0.5 ml-2 block italic cursor-pointer"
            onClick={() => setShowCreateTag(!showCreateTag)}
          >
            {showCreateTag ? "hide" : ""}
          </button>
        </div>
      )}
    </div>
  );
};

export default TagSection;

interface ITagSection {
  formState: TaskFormState;
  handleTagChange: (
    selectedTags: {
      name: string;
      color: string;
    }[]
  ) => void;
  showCreateTag: boolean;
  setShowCreateTag: React.Dispatch<React.SetStateAction<boolean>>;
  newTagName: string;
  setNewTagName: React.Dispatch<React.SetStateAction<string>>;
  newTagColor: string;
  setNewTagColor: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => Promise<void>;
}
