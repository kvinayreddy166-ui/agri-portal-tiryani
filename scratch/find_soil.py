import os
import glob

print("Files matching *soil*:")
for f in glob.glob("*soil*", recursive=True):
    print("Root:", f)
for f in glob.glob("scratch/*soil*", recursive=True):
    print("Scratch:", f)
