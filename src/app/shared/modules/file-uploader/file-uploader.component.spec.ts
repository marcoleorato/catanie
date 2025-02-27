import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import {
  FileUploaderComponent,
  SubmitCaptionEvent,
} from "./file-uploader.component";
import { NgxFileHelpersModule, ReadFile, ReadMode } from "ngx-file-helpers";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";

describe("FileUploaderComponent", () => {
  let component: FileUploaderComponent;
  let fixture: ComponentFixture<FileUploaderComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        schemas: [NO_ERRORS_SCHEMA],
        imports: [
          MatButtonModule,
          MatCardModule,
          MatFormFieldModule,
          MatIconModule,
          MatInputModule,
          NgxFileHelpersModule,
        ],
        declarations: [FileUploaderComponent],
      });
      TestBed.compileComponents();
    })
  );

  afterEach(() => {
    fixture.destroy();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("#onReadStart()", () => {
    it("should set the status", () => {
      expect(component.status).toEqual("");

      component.onReadStart(1);

      expect(component.status).toBeDefined();
    });
  });

  describe("#onFilePicked()", () => {
    it("should emit the picked file", () => {
      spyOn(component.filePicked, "emit");

      const file: ReadFile = {
        name: "test",
        size: 100,
        type: "image/png",
        readMode: ReadMode.dataURL,
        content: "abc123",
        underlyingFile: {
          lastModified: 123,
          name: "test",
          size: 100,
          type: "image/png",
          arrayBuffer: () => new Blob().arrayBuffer(),
          slice: () => new Blob().slice(),
          stream: () => new Blob().stream(),
          text: () => new Blob().text(),
        },
      };
      component.onFilePicked(file);

      expect(component.filePicked.emit).toHaveBeenCalledTimes(1);
      expect(component.filePicked.emit).toHaveBeenCalledWith(file);
    });
  });

  describe("#onReadEnd()", () => {
    it("should set the status and emit the number of files read", () => {
      expect(component.status).toEqual("");
      spyOn(component.readEnd, "emit");

      component.onReadEnd(1);

      expect(component.status).toBeDefined();
      expect(component.readEnd.emit).toHaveBeenCalledTimes(1);
      expect(component.readEnd.emit).toHaveBeenCalledWith(1);
    });
  });

  describe("#onSubmitCaption()", () => {
    it("should emit an event", () => {
      spyOn(component.submitCaption, "emit");

      const event: SubmitCaptionEvent = {
        attachmentId: "testId",
        caption: "test",
      };
      component.onSubmitCaption(event.attachmentId, event.caption);

      expect(component.submitCaption.emit).toHaveBeenCalledTimes(1);
      expect(component.submitCaption.emit).toHaveBeenCalledWith(event);
    });
  });

  describe("#onDeleteAttachment()", () => {
    it("should emit an event", () => {
      spyOn(component.deleteAttachment, "emit");

      const attachmentId = "testId";
      component.onDeleteAttachment(attachmentId);

      expect(component.deleteAttachment.emit).toHaveBeenCalledTimes(1);
      expect(component.deleteAttachment.emit).toHaveBeenCalledWith(
        attachmentId
      );
    });
  });
});
