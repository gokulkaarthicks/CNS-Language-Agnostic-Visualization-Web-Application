from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import matplotlib.pyplot as plt
import io
import base64
import pandas as pd
import numpy as np
import subprocess
import tempfile
import os
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VisualizationRequest(BaseModel):
    code: str
    language: str

def execute_r_code(code: str) -> list:
    with tempfile.TemporaryDirectory() as temp_dir:
        with tempfile.NamedTemporaryFile(suffix='.R', mode='w', delete=False) as r_file:
            init_code = '''
            # Function to safely load a package
            safe_load_package <- function(package_name) {
                if (!require(package_name, character.only = TRUE, quietly = TRUE)) {
                    options(repos = c(CRAN = "https://cloud.r-project.org"))
                    install.packages(package_name, quiet = TRUE)
                }
            }

            # Load required packages
            safe_load_package("ggplot2")

            # Function to save plots
            save_plot <- function(plot_obj, index) {
                filename <- file.path("TEMP_DIR", paste0("plot_", index, ".png"))
                ggsave(filename, plot = plot_obj, width = 8, height = 6)
            }

            # Wrap the user code in a tryCatch
            tryCatch({
            '''
            
            init_code = init_code.replace("TEMP_DIR", temp_dir.replace("\\", "/"))
            
            save_code = '''
            # Save all plots that exist
            if (exists("p1")) save_plot(p1, 1)
            if (exists("p2")) save_plot(p2, 2)
            if (exists("p3")) save_plot(p3, 3)
            if (exists("p4")) save_plot(p4, 4)
            '''
            
            full_code = init_code + "\n" + code + "\n" + save_code + '''
            }, error = function(e) {
                stop(paste("Error executing R code:", e$message))
            })
            '''
            
            r_file.write(full_code)
            r_file_path = r_file.name

        try:
            result = subprocess.run(
                ['Rscript', r_file_path],
                capture_output=True,
                text=True,
                check=True,
                timeout=30
            )
            
            images = []
            for i in range(1, 5):
                plot_file = os.path.join(temp_dir, f'plot_{i}.png')
                if os.path.exists(plot_file):
                    with open(plot_file, 'rb') as img_file:
                        img_data = base64.b64encode(img_file.read()).decode()
                        images.append(f"data:image/png;base64,{img_data}")
            
            os.remove(r_file_path)
            
            return images
            
        except Exception as e:
            if os.path.exists(r_file_path):
                os.remove(r_file_path)
            raise HTTPException(
                status_code=400,
                detail=f"Error executing R code: {str(e)}"
            )

def execute_python_code(code: str) -> list:
    try:
        plt.close('all')
        
        with tempfile.TemporaryDirectory() as temp_dir:
            exec_globals = {
                'plt': plt,
                'np': np,
                'os': os,
            }
            exec_locals = {}

            code_blocks = code.split('\n\n')
            images = []
            
            for block in code_blocks:
                if block.strip():
                    exec(block, exec_globals, exec_locals)
                    
                    if 'plt.plot' in block:
                        filename = os.path.join(temp_dir, f'plot_{len(images)}.png')
                        plt.savefig(filename, format='png', bbox_inches='tight', facecolor='#2d2d2d', edgecolor='none')
                        plt.close()
                        
                        with open(filename, 'rb') as img_file:
                            img_str = base64.b64encode(img_file.read()).decode()
                            images.append(f"data:image/png;base64,{img_str}")
            
            return images if images else []

    except Exception as e:
        error_traceback = traceback.format_exc()
        raise HTTPException(
            status_code=400,
            detail=f"Error executing Python code: {str(e)}\n\nTraceback:\n{error_traceback}"
        )

@app.post("/visualize")
async def create_visualization(request: VisualizationRequest):
    try:
        if request.language == "python":
            images = execute_python_code(request.code)
        elif request.language == "r":
            images = execute_r_code(request.code)
        else:
            raise HTTPException(status_code=400, detail="Unsupported language. Use 'python' or 'r'.")
        
        return {"images": images}
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        error_traceback = traceback.format_exc()
        raise HTTPException(
            status_code=400,
            detail=f"Error: {str(e)}\n\nTraceback:\n{error_traceback}"
        )


@app.get("/")
async def root():
    return {"status": "ok", "message": "Visualization API is running"}