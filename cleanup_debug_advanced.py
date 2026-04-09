#!/usr/bin/env python3
"""
Advanced debug removal - handles nested patterns in catch blocks
Removes: console.error('msg', variable) and console.error("msg:", variable)
"""

import os
import re
from pathlib import Path

class AdvancedDebugRemover:
    def __init__(self):
        self.files_processed = 0
        self.lines_removed = 0
        
    def clean_file(self, filepath):
        """Remove console statements including those with error objects"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            original_count = len(lines)
            cleaned_lines = []
            
            for line in lines:
                # Skip lines that are purely console.error/log/warn statements
                stripped = line.strip()
                if stripped.startswith('console.error(') or \
                   stripped.startswith('console.log(') or \
                   stripped.startswith('console.warn('):
                    # Only skip if it's a complete statement (ends with ;)
                    if stripped.endswith(')') or stripped.endswith(');'):
                        self.lines_removed += 1
                        continue
                
                cleaned_lines.append(line)
            
            # Only write if changed
            if len(cleaned_lines) < original_count:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(cleaned_lines)
                self.files_processed += 1
                return True
            return False
            
        except Exception as e:
            print(f"❌ Error processing {filepath}: {e}")
            return False
    
    def process_directory(self, directory):
        """Process all TypeScript files"""
        ts_files = sorted(Path(directory).rglob('*.ts'))
        found = 0
        
        for ts_file in ts_files:
            found += 1
            if self.clean_file(str(ts_file)):
                rel_path = ts_file.relative_to(directory)
                print(f"✓ Cleaned: {rel_path}")
        
        return found
    
    def report(self):
        """Print summary"""
        print("\n" + "="*60)
        print("ADVANCED CLEANUP SUMMARY")
        print("="*60)
        print(f"Files modified: {self.files_processed}")
        print(f"Debug lines removed: {self.lines_removed}")
        print("="*60)

if __name__ == '__main__':
    target_dirs = [
        './apps/appapi/src/functions',
        './apps/appapi/src/routes',
        './apps/appapi/src/utils',
    ]
    
    remover = AdvancedDebugRemover()
    total_files = 0
    
    for target_dir in target_dirs:
        if not os.path.exists(target_dir):
            continue
        
        print(f"\n📁 Processing: {target_dir}")
        files_found = remover.process_directory(target_dir)
        total_files += files_found
    
    print(f"\n✨ Scanned {total_files} TypeScript files")
    remover.report()
