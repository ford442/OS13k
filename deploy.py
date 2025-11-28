import os
import paramiko
import getpass

# --- Server Configuration ---
HOSTNAME = "1ink.us"
PORT = 22 
USERNAME = "ford442"

# --- Project Configuration ---
# CHANGED: Upload the 'dist' folder we just built
LOCAL_DIRECTORY = "dist" 
# CHANGED: Your target folder
REMOTE_DIRECTORY = "test.1ink.us/web-mouse" 

def upload_directory(sftp_client, local_path, remote_path):
    # ... (Keep your existing upload_directory function exactly as it is) ...
    print(f"Creating remote directory: {remote_path}")
    try:
        sftp_client.mkdir(remote_path)
    except IOError:
        pass

    for item in os.listdir(local_path):
        local_item_path = os.path.join(local_path, item)
        remote_item_path = f"{remote_path}/{item}"

        if os.path.isfile(local_item_path):
            print(f"Uploading file: {local_item_path} -> {remote_item_path}")
            sftp_client.put(local_item_path, remote_item_path)
        elif os.path.isdir(local_item_path):
            upload_directory(sftp_client, local_item_path, remote_item_path)

def main():
    # ... (Keep your existing main function, just ensure password logic is safe) ...
    password = 'GoogleBez12!' # Or use getpass

    transport = None
    sftp = None
    try:
        transport = paramiko.Transport((HOSTNAME, PORT))
        print("Connecting to server...")
        transport.connect(username=USERNAME, password=password)
        print("Connection successful!")

        sftp = paramiko.SFTPClient.from_transport(transport)
        print(f"Starting upload of '{LOCAL_DIRECTORY}' to '{REMOTE_DIRECTORY}'...")
        
        upload_directory(sftp, LOCAL_DIRECTORY, REMOTE_DIRECTORY)
        print("\n✅ Deployment complete!")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        if sftp: sftp.close()
        if transport: transport.close()

if __name__ == "__main__":
    if not os.path.exists(LOCAL_DIRECTORY):
        print(f"Error: Local directory '{LOCAL_DIRECTORY}' not found. Did you run './build.sh' first?")
    else:
        main()
