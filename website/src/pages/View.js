import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import { Button, Form, Pagination } from "react-bootstrap";
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
  const [currentPage, setCurrentPage] = useState([]);

  const fetchProjectDetails = async () => {
    const imageFileTypes = [".jpg", ".png", ".webp"];
    const isImageFile = imageFileTypes.some((fileType) =>
      folderName.endsWith(fileType)
    );

    try {
      setLoading(true);

      let idToken = "";
      if (currentUser) {
        idToken = await currentUser.getIdToken();
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
        setCurrentPage(Object.fromEntries(Object.keys(response.data.tree).map(key => [key, 1])));
        const reorderedFileTree = {
          ...(response.data.tree.train && { train: response.data.tree.train }),
          ...(response.data.tree.test && { test: response.data.tree.test }),
          ...(response.data.tree.valid && { valid: response.data.tree.valid }),
          ...response.data.tree,
        };
        setCurrentFileTree(reorderedFileTree);
        setImageSrc(null);
      }
    } catch (err) {
      setError("Error fetching project details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const idToken = await currentUser.getIdToken();

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

  function formatStatus(status) {
    if (status == "merged") {
      return "Merged";
    } else if (status == "pendingmerge") {
      return "Pending Merge";
    } else if (status == "postprocessing") {
      return "Postprocessing";
    } else {
      return status;
    }
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
              <h2>
                {projectDetails.uploadName && (projectDetails.uploadName.startsWith("FRC2023") ? "FRC 2023" : projectDetails.uploadName.startsWith("FRC2024") ? "FRC 2024" : projectDetails.uploadName)}
              </h2>
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
              {projectDetails.status && (
                <>
                  <small>
                    <strong>Status:</strong>{" "}
                    {formatStatus(projectDetails.status)}
                  </small>
                  <br />
                </>
              )}
              <Button
                variant="primary"
                className="position-absolute top-0 end-0"
                onClick={() => {
                  if (folderName.startsWith("FRC2023") || folderName.startsWith("FRC2024")) {
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
              {currentFileTree && (
                <>
                  {Object.keys(currentFileTree).map((key) => (
                    <div key={key}>
                      <h5>{key.charAt(0).toUpperCase() + key.slice(1)}</h5>
                      <Pagination className="pagination">
                        <div style={{ marginBottom: "10px", width: "100%"  }}>
                          {Object.keys(currentFileTree[key])
                            .slice((currentPage[key] - 1) * 20, currentPage[key] * 20)
                            .map((item, index) => (
                              <div key={index} style={{ marginBottom: "10px", width: "100%" }}>
                                <Pagination.Item
                                  active={item === currentPage[key]}
                                  onClick={() => {
                                    navigate(
                                      "/view/" +
                                      folderName +
                                      "/" +
                                      (key !== "" ? key + "/" : "") +
                                      item
                                    );
                                  }}
                                >
                                  {item.length > 58
                                    ? `${item.substring(0, 55)}...`
                                    : item}
                                </Pagination.Item>
                              </div>
                            ))}
                        </div>
                      </Pagination>
                      {(!(currentPage[key] === 1 && currentPage[key] === Math.ceil(Object.keys(currentFileTree).reduce((total, key) => total + Object.keys(currentFileTree[key]).length, 0) / 20)) && Object.keys(currentFileTree[key]).length >= 20) && (
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <Button
                            variant="primary"
                            disabled={currentPage[key] === 1}
                            onClick={() => setCurrentPage({ ...currentPage, [key]: currentPage[key] - 1 })}
                            style={{ marginRight: "10px" }}
                          >
                            Back
                          </Button>
                          <Button
                            variant="primary"
                            disabled={
                              currentPage[key] ===
                              Math.ceil(
                                Object.keys(currentFileTree).reduce(
                                  (total, key) =>
                                    total + Object.keys(currentFileTree[key]).length,
                                  0
                                ) / 20
                              ) || Object.keys(currentFileTree[key]).length < 20
                            }
                            onClick={() => setCurrentPage({ ...currentPage, [key]: currentPage[key] + 1 })}
                          >
                            Forward
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                </>
              )}
                {!folderName.startsWith("FRC2023") && !folderName.startsWith("FRC2024") && (
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
