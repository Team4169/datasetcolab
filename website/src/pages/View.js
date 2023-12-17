import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import { Button, Form } from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";

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
};

const AnnotationOverlay = ({ annotations, imageUrl }) => {
  const canvasRef = useRef();

  const drawAnnotations = () => {
    const context = canvasRef.current.getContext("2d");

    annotations.forEach((annotation, index) => {
      const [x, y, width, height] = annotation.bbox;

      const color = getColorByCategoryId(annotation.category_id);

      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(x, y, width, height);

      context.fillStyle = color;
      context.fillRect(
        x + width - (context.measureText(annotation.category_name).width + 10),
        y + height,
        context.measureText(annotation.category_name).width + 11,
        20
      );
      context.fillStyle = "white";
      context.font = "12px Arial";
      context.fillText(
        annotation.category_name,
        x + width - context.measureText(annotation.category_name).width - 2,
        y + height + 15
      );
    });
  };

  const getColorByCategoryId = (categoryId) => {
    const colorMap = {
      1: "#FF8080",
      2: "#80FF80",
      3: "#8080FF",
      4: "#FFFF80",
      5: "#FF80FF",
      6: "#80FFFF",
    };

    return colorMap[categoryId] || "#000000";
  };

  useEffect(() => {
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, image.width, image.height);
      drawAnnotations();
    };
  }, [imageUrl, annotations]);

  const uniqueCategories = [
    ...new Set(annotations.map((annotation) => annotation.category_id)),
  ];

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "auto",
        }}
      />
      <div style={styles.colorKey}>
        {uniqueCategories.map((categoryId) => {
          const annotation = annotations.find(
            (annotation) => annotation.category_id === categoryId
          );
          return (
            <div style={styles.colorKeyItem} key={annotation.category_id}>
              <div
                style={{
                  backgroundColor: getColorByCategoryId(annotation.category_id),
                  width: "20px",
                  height: "20px",
                }}
              ></div>
              <span>{annotation.category_name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function View() {
  const { currentUser } = useAuth();
  const { "*": folderName } = useParams();
  const navigate = useNavigate();

  const [projectDetails, setProjectDetails] = useState({});
  const [currentFileTree, setCurrentFileTree] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [annotations, setAnnotations] = useState(null);

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
    const imageFileTypes = [".jpg", ".png", ".webp"];
    const isImageFile = imageFileTypes.some((fileType) =>
      folderName.endsWith(fileType)
    );

    try {
      setLoading(true);

      const idToken = "";
      try {
        idToken = await currentUser.getIdToken();
      } catch {
      }

      if (isImageFile) {
        const config = { headers: { idToken: idToken } };

        const response = await axios.get(
          `https://api.datasetcolab.com/annotations/${folderName}`,
          config
        );

        console.log(response.data);

        setAnnotations(response.data);

        setImageSrc(
          `https://api.datasetcolab.com/view/${folderName}?idToken=${idToken}`
        );
      } else {
        const config = { headers: { idToken: idToken } };

        const response = await axios.get(
          `https://api.datasetcolab.com/view/${folderName}`,
          config
        );

        setProjectDetails(response.data);
        setCurrentFileTree(response.data.tree);
        setImageSrc(null);
      }
    } catch (err) {
      console.log(err);
      setError("Error fetching project details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const idToken = "";
      try {
        idToken = await currentUser.getIdToken();
      } catch {
      }

      const config = { headers: { idToken: idToken } };

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
    const searchedFileTree = searchFiles(projectDetails.tree, searchTerm);
    setCurrentFileTree(searchedFileTree);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [folderName]);

  const renderTree = (treeData, parentName = "", first = false) => {
    const treeStyle = {
      cursor: "pointer",
      backgroundColor: "white",
      padding: "5px",
      marginBottom: "5px",
    };
    treeStyle.marginLeft = first ? "" : "25px";
    return (
      <ul
        className="list-unstyled"
        style={parentName === "" ? { paddingLeft: 0 } : {}}
      >
        {Object.entries(treeData).map(([name, value], index) => (
          <li key={name}>
            <div style={treeStyle}>
              {typeof value === "object" ? (
                <>
                  <span onClick={() => handleToggleSection(parentName + name)}>
                    {isSectionOpen(parentName + name) ? "▼" : "►"}{" "}
                    {name.length < 63
                      ? name
                      : name.substring(0, 40) +
                        "..." +
                        name.substring(name.length - 20)}
                  </span>
                  {isSectionOpen(parentName + name) &&
                    renderTree(value, parentName + name)}
                </>
              ) : (
                <Link
                  to={
                    "/view/" +
                    folderName +
                    "/" +
                    (parentName !== "" ? parentName + "/" : "") +
                    name
                  }
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent closing the folder when clicking on the link
                  }}
                >
                  {name.length < 63
                    ? name
                    : name.substring(0, 40) +
                      "..." +
                      name.substring(name.length - 20)}
                </Link>
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
  };

  return (
    <div style={{ padding: "20px" }} className="project-details">
      {imageSrc && (
        <div>
          <AnnotationOverlay annotations={annotations} imageUrl={imageSrc} />
        </div>
      )}
      {!imageSrc && (
        <div>
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
              {projectDetails.uploadTime && (
                <>
                  <small>
                    <strong>Upload Time:</strong>{" "}
                    {formatUploadTime(projectDetails.uploadTime)}
                  </small>
                  <br />
                </>
              )}
              {projectDetails.datasetType && (
                <>
                  <small>
                    <strong>Dataset Type:</strong> {projectDetails.datasetType}
                  </small>
                  <br />
                </>
              )}
              {projectDetails.targetDataset && (
                <>
                  <small>
                    <strong>Target Dataset:</strong>{" "}
                    {formatTargetDataset(projectDetails.targetDataset)}
                  </small>
                  <br />
                </>
              )}
              <Button
                variant="primary"
                className="position-absolute top-0 end-0"
                onClick={() => {
                  if (folderName === "FRC2023") {
                    navigate("/download");
                  } else {
                    navigate("/");
                  }
                }}
              >
                Back
              </Button>
              <Form onSubmit={handleSubmit}>
                <Form.Control
                  type="text"
                  placeholder="Search files"
                  onChange={handleSearch}
                  style={{ margin: "20px 0px" }}
                />
              </Form>
              <div style={styles.treeContainer}>
                {renderTree(currentFileTree, "", true)}
              </div>
              {folderName !== "FRC2023" && (
                <div style={{ padding: "10px 0" }}>
                  <Button variant="danger" onClick={handleDeleteProject}>
                    Delete Project
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
