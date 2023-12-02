import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import { Card, Button, Form, FormControl } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

const styles = {
  padding: "20px",
  downloadContainer: { maxWidth: "800px", margin: "0 auto" },
  datasetCard: { marginBottom: "20px", border: "1px solid #e9ecef" },
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
    marginLeft: "20px",
  },
};

export default function View() {
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

      const filesResponse = await axios.get(
        `https://api.datasetcolab.com/files/${folderName}`,
        config
      );
      const viewResponse = await axios.get(
        `https://api.datasetcolab.com/view/${folderName}`,
        config
      );

      setProjectDetails(viewResponse.data);
      setFileTree(filesResponse.data);
    } catch (err) {
      setError("Error fetching project details.");
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

      await axios.get(
        `https://api.datasetcolab.com/delete/${folderName}`,
        config
      );
      navigate("/");
    } catch (err) {
      setError("Error deleting project.");
    }
  };

  function formatUploadTime(uploadTime) {
    if (!uploadTime) return null;

    const [datePart, timePart] = uploadTime.split("_");
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");

    const formattedDate = new Date(
      year,
      month - 1,
      day,
      hour,
      minute
    ).toLocaleString();
    return formattedDate;
  }

  function formatTargetDataset(targetDataset) {
    if (!targetDataset) return null;
    return targetDataset.replace(/FRC(\d{4})/, "FRC $1");
  }

  const searchFiles = (treeData, searchTerm) => {
    const result = {};

    Object.entries(treeData).forEach(([name, value]) => {
      if (name.toLowerCase().includes(searchTerm)) {
        result[name] = value;
      } else if (typeof value === "object") {
        const matchingChildren = searchFiles(value, searchTerm);
        if (Object.keys(matchingChildren).length > 0) {
          result[name] = matchingChildren;
        }
      }
    });

    return result;
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const searchedFileTree = searchFiles(fileTree, searchTerm);
    setFileTree(searchedFileTree);
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [folderName]);

  const renderTree = (treeData, parentName = "") => (
    <ul
      className="list-unstyled"
      style={
        parentName === ""
          ? { ...styles.treeContainer, paddingLeft: 0 }
          : styles.treeContainer
      }
    >
      {Object.entries(treeData).map(([name, value], index) => (
        <li key={name}>
          <div
            style={{
              cursor: "pointer",
              backgroundColor: "white",
              padding: "5px",
              marginBottom: "5px",
            }}
            onClick={() => handleToggleSection(parentName + name)}
          >
            {typeof value === "object" ? (
              <>
                <span>
                  {isSectionOpen(parentName + name) ? "▼" : "►"}{" "}
                  {name.length > 20 ? name.substring(0, 20) + "..." : name}
                </span>
                {isSectionOpen(parentName + name) &&
                  renderTree(value, parentName + name)}
              </>
            ) : (
              name
            )}
          </div>
          {isSectionOpen(parentName + name) &&
            index === 9 &&
            Object.entries(treeData).length > 10 && (
              <div
                style={{
                  cursor: "pointer",
                  backgroundColor: "white",
                  padding: "5px",
                  marginBottom: "5px",
                }}
                onClick={() => handleToggleSection(parentName + "more")}
              >
                Show more
              </div>
            )}
        </li>
      ))}
      {isSectionOpen(parentName + "more") &&
        renderTree(Object.entries(treeData).slice(10), parentName + "more")}
    </ul>
  );

  return (
    <div style={{ padding: "20px" }}>
      <div className="project-details">
        {isLoading ? (
          <>
            <h2>Loading project details...</h2>
            {error && (
              <Alert
                variant="danger"
                onClose={() => setError(null)}
                dismissible
              >
                {error}
              </Alert>
            )}
          </>
        ) : (
          <div style={{ position: "relative" }}>
            <h2>{projectDetails.uploadName}</h2>
            {error && (
              <Alert
                variant="danger"
                onClose={() => setError(null)}
                dismissible
              >
                {error}
              </Alert>
            )}
            <small>
              <strong>Upload Time:</strong>{" "}
              {formatUploadTime(projectDetails.uploadTime)}
            </small>
            <br />
            <small>
              <strong>Dataset Type:</strong> {projectDetails.datasetType}
            </small>
            <br />
            <small>
              <strong>Target Dataset:</strong>{" "}
              {formatTargetDataset(projectDetails.targetDataset)}
            </small>
            <br />
            <Button
              variant="primary"
              className="position-absolute top-0 end-0"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </Button>
            <Form style={{ margin: "20px 0px" }}>
              <FormControl
                type="text"
                placeholder="Search files"
                onChange={handleSearch}
              />
            </Form>
            <div style={styles.treeContainer}>{renderTree(fileTree)}</div>
            <div style={{ padding: "10px 0" }}>
              <Button variant="danger" onClick={handleDeleteProject}>
                Delete Project
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
