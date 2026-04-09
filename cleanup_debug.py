#!/usr/bin/env python3
"""
Script to remove debug console.error/log statements from appapi
This enables production-ready SaaS deployment
"""

import os
import re
from pathlib import Path

class DebugRemover:
    def __init__(self):
        self.files_processed = 0
        self.errors_removed = 0
        self.logs_removed = 0
        
    def clean_file(self, filepath):
        """Remove console.error/log from a TypeScript file"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            
            # Pattern 1: console.error("...: message")
            content = re.sub(
                r'^\s*console\.error\([^)]*\);\n',
                '',
                content,
                flags=re.MULTILINE
            )
            self.errors_removed += len(re.findall(r'console\.error', original)) - len(re.findall(r'console\.error', content))
            
            # Pattern 2: console.log("...")
            content = re.sub(
                r'^\s*console\.log\([^)]*\);\n',
                '',
                content,
                flags=re.MULTILINE
            )
            self.logs_removed += len(re.findall(r'console\.log', original)) - len(re.findall(r'console\.log', content))
            
            # Pattern 3: console.warn("...")
            content = re.sub(
                r'^\s*console\.warn\([^)]*\);\n',
                '',
                content,
                flags=re.MULTILINE
            )
            
            # Only write if changed
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.files_processed += 1
                return True
            return False
            
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            return False
    
    def process_directory(self, directory):
        """Recursively process all TypeScript files in directory"""
        ts_files = Path(directory).rglob('*.ts')
        
        for ts_file in ts_files:
            if self.clean_file(str(ts_file)):
                print(f"✓ Cleaned: {ts_file.relative_to(directory)}")
    
    def report(self):
        """Print summary report"""
        print("\n" + "="*60)
        print("DEBUG CLEANUP SUMMARY")
        print("="*60)
        print(f"Files processed: {self.files_processed}")
        print(f"console.error removed: {self.errors_removed}")
        print(f"console.log removed: {self.logs_removed}")
        print(f"Total statements removed: {self.errors_removed + self.logs_removed}")
        print("="*60)

if __name__ == '__main__':
    # Target appapi functions directory
    appapi_src = './apps/appapi/src/functions'
    
    if not os.path.exists(appapi_src):
        print(f"Error: Directory {appapi_src} not found")
        exit(1)
    
    remover = DebugRemover()
    print(f"Processing directory: {appapi_src}\n")
    remover.process_directory(appapi_src)
    remover.report()
