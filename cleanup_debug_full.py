#!/usr/bin/env python3
"""
Comprehensive debug removal script for entire appapi
- Removes console.error/log/warn from all TypeScript files
- Targets functions/, routes/, and utils/ directories
- SaaS production-ready deployment
"""

import os
import re
from pathlib import Path

class DebugRemover:
    def __init__(self):
        self.files_processed = 0
        self.errors_removed = 0
        self.logs_removed = 0
        self.warns_removed = 0
        
    def clean_file(self, filepath):
        """Remove console.error/log/warn from a TypeScript file"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            
            # Pattern: console.error("...")
            content = re.sub(
                r'^\s*console\.error\([^;]*\);\n',
                '',
                content,
                flags=re.MULTILINE
            )
            self.errors_removed += len(re.findall(r'console\.error', original)) - len(re.findall(r'console\.error', content))
            
            # Pattern: console.log("...")
            content = re.sub(
                r'^\s*console\.log\([^;]*\);\n',
                '',
                content,
                flags=re.MULTILINE
            )
            self.logs_removed += len(re.findall(r'console\.log', original)) - len(re.findall(r'console\.log', content))
            
            # Pattern: console.warn("...")
            content = re.sub(
                r'^\s*console\.warn\([^;]*\);\n',
                '',
                content,
                flags=re.MULTILINE
            )
            self.warns_removed += len(re.findall(r'console\.warn', original)) - len(re.findall(r'console\.warn', content))
            
            # Only write if changed
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.files_processed += 1
                return True
            return False
            
        except Exception as e:
            print(f"❌ Error processing {filepath}: {e}")
            return False
    
    def process_directory(self, directory):
        """Recursively process all TypeScript files in directory"""
        ts_files = Path(directory).rglob('*.ts')
        found = 0
        
        for ts_file in ts_files:
            found += 1
            if self.clean_file(str(ts_file)):
                print(f"✓ Cleaned: {ts_file.relative_to(directory)}")
        
        return found
    
    def report(self):
        """Print summary report"""
        print("\n" + "="*60)
        print("COMPREHENSIVE DEBUG CLEANUP SUMMARY")
        print("="*60)
        print(f"Files modified: {self.files_processed}")
        print(f"console.error removed: {self.errors_removed}")
        print(f"console.log removed: {self.logs_removed}")
        print(f"console.warn removed: {self.warns_removed}")
        print(f"Total statements removed: {self.errors_removed + self.logs_removed + self.warns_removed}")
        print("="*60)

if __name__ == '__main__':
    # Target all appapi directories
    target_dirs = [
        './apps/appapi/src/functions',
        './apps/appapi/src/routes',
        './apps/appapi/src/utils',
    ]
    
    remover = DebugRemover()
    total_files = 0
    
    for target_dir in target_dirs:
        if not os.path.exists(target_dir):
            print(f"⚠️  Directory not found: {target_dir}")
            continue
        
        print(f"\n📁 Processing directory: {target_dir}")
        files_found = remover.process_directory(target_dir)
        total_files += files_found
    
    print(f"\n✨ Scanned {total_files} TypeScript files total")
    remover.report()
