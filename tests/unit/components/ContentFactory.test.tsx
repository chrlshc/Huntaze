/**
 * Unit Tests for Content Factory Component
 *
 * **Feature: content-posting-system**
 * **Validates: Requirements 1.1, 7.1**
 *
 * Tests:
 * - S3 upload with mock
 * - Form validation
 * - API call on submit
 * - Feedback display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentFactory } from "../../../components/content/ContentFactory";

// Mock the useContentTasks hook
const mockCreateTask = vi.fn();
const mockUploadFile = vi.fn();

vi.mock("@/lib/hooks/useContentTasks", () => ({
  useContentTasks: () => ({
    createTask: mockCreateTask,
    uploadFile: mockUploadFile,
    error: null,
  }),
}));

describe("ContentFactory Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render the form with all required fields", () => {
      render(<ContentFactory />);

      expect(screen.getByTestId("content-factory")).toBeInTheDocument();
      expect(screen.getByTestId("content-form")).toBeInTheDocument();
      expect(screen.getByTestId("platform-tiktok")).toBeInTheDocument();
      expect(screen.getByTestId("platform-instagram")).toBeInTheDocument();
      expect(screen.getByTestId("caption-input")).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    });

    it("should show file upload by default", () => {
      render(<ContentFactory />);

      expect(screen.getByTestId("source-upload")).toBeChecked();
      expect(screen.getByTestId("file-input")).toBeInTheDocument();
    });

    it("should show URL input when URL source is selected", async () => {
      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("source-url"));

      expect(screen.getByTestId("source-url-input")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error when no platform is selected", async () => {
      render(<ContentFactory />);

      // Fill caption but no platform
      await userEvent.type(screen.getByTestId("caption-input"), "Test caption");
      await userEvent.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Select at least one platform")).toBeInTheDocument();
    });

    it("should show error when caption is empty", async () => {
      render(<ContentFactory />);

      // Select platform but no caption
      await userEvent.click(screen.getByTestId("platform-tiktok"));
      await userEvent.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Caption is required")).toBeInTheDocument();
    });

    it("should show error when caption exceeds 2200 characters", async () => {
      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      
      const longCaption = "a".repeat(2201);
      await userEvent.type(screen.getByTestId("caption-input"), longCaption);
      await userEvent.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Caption must be 2200 characters or less")).toBeInTheDocument();
    });

    it("should show error when no file is uploaded for UPLOAD source type", async () => {
      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      await userEvent.type(screen.getByTestId("caption-input"), "Test caption");
      await userEvent.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Please upload a video file")).toBeInTheDocument();
    });

    it("should show error when URL is empty for URL source type", async () => {
      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      await userEvent.type(screen.getByTestId("caption-input"), "Test caption");
      await userEvent.click(screen.getByTestId("source-url"));
      await userEvent.click(screen.getByTestId("submit-button"));

      expect(screen.getByText("Video URL is required")).toBeInTheDocument();
    });
  });

  describe("S3 Upload", () => {
    it("should call uploadFile when a file is selected", async () => {
      mockUploadFile.mockResolvedValue("uploads/123/test.mp4");

      render(<ContentFactory />);

      const file = new File(["video content"], "test.mp4", { type: "video/mp4" });
      const fileInput = screen.getByTestId("file-input");

      await userEvent.upload(fileInput, file);

      expect(mockUploadFile).toHaveBeenCalledWith(file);
    });

    it("should show upload success message after successful upload", async () => {
      mockUploadFile.mockResolvedValue("uploads/123/test.mp4");

      render(<ContentFactory />);

      const file = new File(["video content"], "test.mp4", { type: "video/mp4" });
      const fileInput = screen.getByTestId("file-input");

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId("upload-success")).toBeInTheDocument();
      });
    });

    it("should show error when upload fails", async () => {
      mockUploadFile.mockResolvedValue(null);

      render(<ContentFactory />);

      const file = new File(["video content"], "test.mp4", { type: "video/mp4" });
      const fileInput = screen.getByTestId("file-input");

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText("Failed to upload file. Please try again.")).toBeInTheDocument();
      });
    });

    it("should reject invalid file types", async () => {
      render(<ContentFactory />);

      const file = new File(["text content"], "test.txt", { type: "text/plain" });
      const fileInput = screen.getByTestId("file-input");

      // Manually trigger change event since userEvent.upload validates accept attribute
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText("Invalid file type. Allowed: MP4, MOV, WebM")).toBeInTheDocument();
      });
    });
  });

  describe("API Submit", () => {
    it("should call createTask with correct data on submit", async () => {
      mockUploadFile.mockResolvedValue("uploads/123/test.mp4");
      mockCreateTask.mockResolvedValue({ taskIds: ["task-1", "task-2"] });

      render(<ContentFactory />);

      // Select platforms
      await userEvent.click(screen.getByTestId("platform-tiktok"));
      await userEvent.click(screen.getByTestId("platform-instagram"));

      // Upload file
      const file = new File(["video content"], "test.mp4", { type: "video/mp4" });
      await userEvent.upload(screen.getByTestId("file-input"), file);

      await waitFor(() => {
        expect(screen.getByTestId("upload-success")).toBeInTheDocument();
      });

      // Fill caption
      await userEvent.type(screen.getByTestId("caption-input"), "Test caption");

      // Submit
      await userEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith({
          platforms: ["TIKTOK", "INSTAGRAM"],
          asset: {
            sourceType: "UPLOAD",
            assetKey: "uploads/123/test.mp4",
          },
          script: {
            caption: "Test caption",
          },
        });
      });
    });

    it("should call createTask with URL source type", async () => {
      mockCreateTask.mockResolvedValue({ taskIds: ["task-1"] });

      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      await userEvent.click(screen.getByTestId("source-url"));
      await userEvent.type(screen.getByTestId("source-url-input"), "https://example.com/video.mp4");
      await userEvent.type(screen.getByTestId("caption-input"), "Test caption");
      await userEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith({
          platforms: ["TIKTOK"],
          asset: {
            sourceType: "URL",
            sourceUrl: "https://example.com/video.mp4",
          },
          script: {
            caption: "Test caption",
          },
        });
      });
    });

    it("should include optional fields when provided", async () => {
      mockCreateTask.mockResolvedValue({ taskIds: ["task-1"] });

      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      await userEvent.click(screen.getByTestId("source-url"));
      await userEvent.type(screen.getByTestId("source-url-input"), "https://example.com/video.mp4");
      await userEvent.type(screen.getByTestId("caption-input"), "Test caption");
      await userEvent.type(screen.getByTestId("hook-input"), "Hook text");
      await userEvent.type(screen.getByTestId("body-input"), "Body text");
      await userEvent.type(screen.getByTestId("cta-input"), "CTA text");
      await userEvent.type(screen.getByTestId("trend-input"), "#trending");
      await userEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith(
          expect.objectContaining({
            script: {
              caption: "Test caption",
              hook: "Hook text",
              body: "Body text",
              cta: "CTA text",
            },
            trendLabel: "#trending",
          })
        );
      });
    });

    it("should disable submit button while submitting", async () => {
      mockCreateTask.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      mockUploadFile.mockResolvedValue("uploads/123/test.mp4");

      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      const file = new File(["video"], "test.mp4", { type: "video/mp4" });
      await userEvent.upload(screen.getByTestId("file-input"), file);
      await waitFor(() => expect(screen.getByTestId("upload-success")).toBeInTheDocument());
      await userEvent.type(screen.getByTestId("caption-input"), "Test");
      
      await userEvent.click(screen.getByTestId("submit-button"));

      expect(screen.getByTestId("submit-button")).toBeDisabled();
      expect(screen.getByTestId("submit-button")).toHaveTextContent("Creating...");
    });
  });

  describe("Feedback Display", () => {
    it("should show success message after successful submission", async () => {
      mockUploadFile.mockResolvedValue("uploads/123/test.mp4");
      mockCreateTask.mockResolvedValue({ taskIds: ["task-1", "task-2"] });

      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      const file = new File(["video"], "test.mp4", { type: "video/mp4" });
      await userEvent.upload(screen.getByTestId("file-input"), file);
      await waitFor(() => expect(screen.getByTestId("upload-success")).toBeInTheDocument());
      await userEvent.type(screen.getByTestId("caption-input"), "Test");
      await userEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("feedback-message")).toBeInTheDocument();
        expect(screen.getByTestId("feedback-message")).toHaveTextContent("Successfully created 2 task(s)");
      });
    });

    it("should show error message when submission fails", async () => {
      mockUploadFile.mockResolvedValue("uploads/123/test.mp4");
      mockCreateTask.mockResolvedValue(null);

      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      const file = new File(["video"], "test.mp4", { type: "video/mp4" });
      await userEvent.upload(screen.getByTestId("file-input"), file);
      await waitFor(() => expect(screen.getByTestId("upload-success")).toBeInTheDocument());
      await userEvent.type(screen.getByTestId("caption-input"), "Test");
      await userEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("feedback-message")).toBeInTheDocument();
        expect(screen.getByTestId("feedback-message")).toHaveClass("bg-red-100");
      });
    });

    it("should call onSuccess callback with task IDs", async () => {
      const onSuccess = vi.fn();
      mockUploadFile.mockResolvedValue("uploads/123/test.mp4");
      mockCreateTask.mockResolvedValue({ taskIds: ["task-1"] });

      render(<ContentFactory onSuccess={onSuccess} />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      const file = new File(["video"], "test.mp4", { type: "video/mp4" });
      await userEvent.upload(screen.getByTestId("file-input"), file);
      await waitFor(() => expect(screen.getByTestId("upload-success")).toBeInTheDocument());
      await userEvent.type(screen.getByTestId("caption-input"), "Test");
      await userEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(["task-1"]);
      });
    });

    it("should call onError callback when submission fails", async () => {
      const onError = vi.fn();
      mockUploadFile.mockResolvedValue("uploads/123/test.mp4");
      mockCreateTask.mockRejectedValue(new Error("API Error"));

      render(<ContentFactory onError={onError} />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      const file = new File(["video"], "test.mp4", { type: "video/mp4" });
      await userEvent.upload(screen.getByTestId("file-input"), file);
      await waitFor(() => expect(screen.getByTestId("upload-success")).toBeInTheDocument());
      await userEvent.type(screen.getByTestId("caption-input"), "Test");
      await userEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("API Error");
      });
    });

    it("should reset form after successful submission", async () => {
      mockUploadFile.mockResolvedValue("uploads/123/test.mp4");
      mockCreateTask.mockResolvedValue({ taskIds: ["task-1"] });

      render(<ContentFactory />);

      await userEvent.click(screen.getByTestId("platform-tiktok"));
      const file = new File(["video"], "test.mp4", { type: "video/mp4" });
      await userEvent.upload(screen.getByTestId("file-input"), file);
      await waitFor(() => expect(screen.getByTestId("upload-success")).toBeInTheDocument());
      await userEvent.type(screen.getByTestId("caption-input"), "Test");
      await userEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("feedback-message")).toBeInTheDocument();
      });

      // Form should be reset
      expect(screen.getByTestId("caption-input")).toHaveValue("");
      expect(screen.getByTestId("platform-tiktok")).not.toBeChecked();
    });
  });
});
