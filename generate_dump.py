import os
from pathlib import Path

def generate_project_markdown(root_directory=".", output_filename="project_dump.md"):
    root_path = Path(root_directory).resolve()
    tree_lines = []
    ordered_file_paths = []
    
    # Using chr(96) to dynamically generate backticks (`).
    # This prevents markdown parsers/viewers from breaking when displaying this code.
    md_ticks = chr(96) * 3
    md_ticks_quad = chr(96) * 4

    def build_tree(current_dir, prefix=""):
        # Sort directories first, then files, both alphabetically
        try:
            entries = sorted(list(current_dir.iterdir()), key=lambda x: (x.is_file(), x.name))
        except PermissionError:
            tree_lines.append(f"{prefix}└── [Access Denied]")
            return

        entries_count = len(entries)
        for i, entry in enumerate(entries):
            # Skip hidden git folders or the output file itself to prevent infinite loops/clutter
            if entry.name == ".git" or entry.name == output_filename:
                continue

            is_last = (i == entries_count - 1)
            connector = "└── " if is_last else "├── "

            if entry.is_dir():
                tree_lines.append(f"{prefix}{connector}{entry.name}/")
                extension_prefix = "    " if is_last else "│   "
                build_tree(entry, prefix + extension_prefix)
            else:
                tree_lines.append(f"{prefix}{connector}{entry.name}")
                ordered_file_paths.append(entry)

    # 1. Build the tree map and collect files
    print(f"Scanning directory: {root_path}")
    tree_lines.append(f"{root_path.name}/")
    build_tree(root_path)

    # 2. Write everything to the Markdown file
    output_path = root_path / output_filename
    print(f"Generating markdown file: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8') as out_file:
        # Write the Tree Map
        out_file.write(f"# Project Directory Tree\n\n{md_ticks}text\n")
        out_file.write("\n".join(tree_lines))
        out_file.write(f"\n{md_ticks}\n\n")
        out_file.write("---\n\n# File Contents\n\n")

        # Write the contents of each file
        for file_path in ordered_file_paths:
            # Get the relative path for the header
            rel_path = file_path.relative_to(root_path)
            out_file.write(f"## `{rel_path}`\n\n")
            
            # Determine syntax highlighting based on file extension
            ext = file_path.suffix.lstrip('.')
            if not ext:
                ext = "text"
            if ext == "stub": # Handle .stub files as text or markdown
                ext = "markdown"

            try:
                with open(file_path, 'r', encoding='utf-8') as in_file:
                    content = in_file.read()
                
                # Wrap content in codeblocks. 
                # If the file itself contains triple backticks, we pad the wrapper.
                wrapper = md_ticks_quad if md_ticks in content else md_ticks
                
                out_file.write(f"{wrapper}{ext}\n{content}\n{wrapper}\n\n")
            
            except UnicodeDecodeError:
                # Handles binary files (images, compiled files, etc.) gracefully
                out_file.write(f"{md_ticks}text\n[Binary or non-UTF-8 content omitted]\n{md_ticks}\n\n")
            except Exception as e:
                out_file.write(f"{md_ticks}text\n[Error reading file: {e}]\n{md_ticks}\n\n")

    print("Done!")

if __name__ == "__main__":
    # You can change "." to any absolute or relative path
    generate_project_markdown(root_directory=".", output_filename="sdd_template_full_dump.md")
