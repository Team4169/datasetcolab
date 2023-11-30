import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Alert from 'react-bootstrap/Alert';
import { Card, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

const styles = {
    padding: "20px",
    downloadContainer: { maxWidth: "800px", margin: "0 auto" },
    datasetCard: { marginBottom: "20px", border: "1px solid #e9ecef" },
    optionsContainer: {
      padding: "10px",
      borderRadius: "5px",
      backgroundColor: "#f8f9fa",
      position: "relative",
    },
    downloadMethodContainer: { display: "flex", gap: "10px" },
    downloadButtonsContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      marginTop: "10px",
      border: "none",
      padding: "0",
    },
    codeBlock: {
      backgroundColor: "#e9ecef",
      padding: "10px",
      borderRadius: "5px",
      overflow: "auto",
      position: "relative",
    },
    copyButton: {
      position: "absolute",
      top: "5px",
      right: "5px",
      cursor: "pointer",
    },
    alertContainer: {
      position: "fixed",
      bottom: "10px",
      left: "10px",
      zIndex: 999,
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    closeButton: { cursor: "pointer" },
    checkboxGroup: { display: "flex", gap: "10px", flexWrap: "wrap" },
  treeContainer: {
    marginLeft: '20px',
  },
};

const View = () => {
    const { currentUser } = useAuth();
    const { folderName } = useParams();
    const navigate = useNavigate();
  
    const [projectDetails, setProjectDetails] = useState({});
    const [fileTree, setFileTree] = useState({});
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const [openSections, setOpenSections] = useState([]);
  
    const handleToggleSection = (sectionName) => {
      setOpenSections((prevOpenSections) =>
        prevOpenSections.includes(sectionName)
          ? prevOpenSections.filter((section) => section !== sectionName)
          : [...prevOpenSections, sectionName]
      );
    };
  
    const isSectionOpen = (sectionName) => openSections.includes(sectionName);
  
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
  
        const idToken = await currentUser.getIdToken();
        const config = {
          headers: {
            idToken: idToken,
          },
        };
  
        // Fetch project details from /files/{folderName}
        const filesResponse = await axios.get(`https://api.datasetcolab.com/files/${folderName}`, config);
        const filesData = filesResponse.data;
  
        // Fetch additional project details from /view/{folderName}
        const viewResponse = await axios.get(`https://api.datasetcolab.com/view/${folderName}`, config);
        const viewData = viewResponse.data;
  
        // Set separate variables for project details and file tree
        setProjectDetails(viewData);
        setFileTree(filesData);
      } catch (err) {
        setError('Error fetching project details.');
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteProject = async () => {
      try {
        const idToken = await currentUser.getIdToken();
        const config = {
          headers: {
            idToken: idToken,
          },
        };

        console.log(config);
  
        await axios.post(`https://api.datasetcolab.com/delete/${folderName}`, config);
        navigate('/');
      } catch (err) {
        setError('Error deleting project.');
      }
    };
  
    function formatUploadTime(uploadTime) {
      if (!uploadTime) {
        return null;
      }
  
      const [datePart, timePart] = uploadTime.split('_');
      const [year, month, day] = datePart.split('-');
      const [hour, minute] = timePart.split(':');
  
      const formattedDate = new Date(year, month - 1, day, hour, minute).toLocaleString();
      return formattedDate;
    }
  
    function formatTargetDataset(targetDataset) {
      if (!targetDataset) {
        return null;
      }
  
      const formattedTargetDataset = targetDataset.replace(/FRC(\d{4})/, 'FRC $1');
      return formattedTargetDataset;
    }
  
    useEffect(() => {
      fetchProjectDetails();
    }, [folderName]);
  
    const renderTree = (treeData, parentName = '') => (
        <ul className="list-unstyled" style={styles.treeContainer}>
          {Object.entries(treeData).map(([name, value]) => (
            <li key={name}>
              <div>
                {typeof value === 'object' ? (
                  <>
                    <Button
                      variant="link"
                      onClick={() => handleToggleSection(parentName + name)}
                      style={{ marginRight: '5px' }}
                    >
                      {isSectionOpen(parentName + name) ? '-' : '+'}
                    </Button>
                    <strong>{name}/</strong>
                    {isSectionOpen(parentName + name) && renderTree(value, parentName + name)}
                  </>
                ) : (
                  name
                )}
              </div>
            </li>
          ))}
        </ul>
      );
      
  return (
    <div style={{ padding: '20px' }}>
      <div className="project-details">
        {isLoading ? (
          <>
            <h2>Loading project details...</h2>
            {error && (
              <Alert variant="danger" onClose={() => setError(null)} dismissible>
                {error}
              </Alert>
            )}
          </>
        ) : (
          <div style={{ position: 'relative' }}>
            <h2>{projectDetails.uploadName}</h2>
            {error && (
              <Alert variant="danger" onClose={() => setError(null)} dismissible>
                {error}
              </Alert>
            )}
            <small>
              <strong>Upload Time:</strong> {formatUploadTime(projectDetails.uploadTime)}
            </small>
            <br />
            <small>
              <strong>Dataset Type:</strong> {projectDetails.datasetType}
            </small>
            <br />
            <small>
              <strong>Target Dataset:</strong> {formatTargetDataset(projectDetails.targetDataset)}
            </small>
            <br />
            <Button variant="danger" onClick={handleDeleteProject}>
              Delete Project
            </Button>
            <Button
              variant="primary"
              className="position-absolute top-0 end-0 m-1"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </Button>
            {renderTree(fileTree)} {/* Render the tree */}
          </div>
        )}
      </div>
    </div>
  );
};

export default View;