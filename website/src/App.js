import axios from 'axios';
import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #f4f4f4;
`;

const FileInput = styled.input`
    margin: 20px 0;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
`;

const UploadButton = styled.button`
    padding: 10px 20px;
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
        background-color: #0056b3;
    }
`;
 
function App() {
    const [selectedFiles, setSelectedFiles] = useState([]);

    const onFileChange = event => {
        setSelectedFiles([...event.target.files]);
    };

    const onUpload = async () => {
        const formData = new FormData();

        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append('files', selectedFiles[i]);
        }

        try {
            await axios.post('https://api.seanmabli.com:3433/upload', formData);
            //await axios.post('https://localhost:3433/upload', formData);
            alert('Files uploaded successfully');
        } catch (error) {
            alert('Error uploading files');
        }
    };

    return (
        <Container>
            <FileInput type="file" onChange={onFileChange} multiple />
            <UploadButton onClick={onUpload}>Upload</UploadButton>
        </Container>
    );
}

export default App;
