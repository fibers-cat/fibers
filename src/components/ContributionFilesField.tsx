import { useState, type Ref } from 'react';
import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import { useTranslations, type Locale } from '@/i18n';
import { formatFileSize } from '@/data/materials';

type Props = {
  locale: Locale;
  inputRef: Ref<HTMLInputElement>;
  files: File[];
  error: string;
  showError: boolean;
  onAcceptFiles: (files: File[]) => void;
  onRemoveFile: (file: File) => void;
};

const fileKeys = new WeakMap<File, string>();
let nextFileKey = 0;

function getFileKey(file: File): string {
  let key = fileKeys.get(file);
  if (!key) {
    key = `contribution-file-${++nextFileKey}`;
    fileKeys.set(file, key);
  }
  return key;
}

function fileExtension(name: string): string {
  const index = name.lastIndexOf('.');
  if (index <= 0 || index === name.length - 1) return 'FILE';
  return name.slice(index + 1).toUpperCase().slice(0, 4);
}

export default function ContributionFilesField({
  locale,
  inputRef,
  files,
  error,
  showError,
  onAcceptFiles,
  onRemoveFile,
}: Props) {
  const t = useTranslations(locale);
  const [isDragging, setIsDragging] = useState(false);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="contribution-files">
      <span className="contribution-field-label" id="contribution-files-label">
        {t('contributionForm.attachFiles')}
        <span className="contribution-required-mark" aria-hidden="true">*</span>
      </span>
      <input
        ref={inputRef}
        id="contribution-files-input"
        className="file-input"
        type="file"
        multiple
        required
        accept=".pdf,.txt,.c,.cpp,.png,.jpg,.jpeg,.webp,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        aria-labelledby="contribution-files-label"
        aria-describedby="contribution-files-hint"
        aria-invalid={showError || undefined}
        onChange={(event) => {
          const selected = Array.from(event.target.files ?? []);
          event.target.value = '';
          onAcceptFiles(selected);
        }}
      />
      <label
        className={`file-dropzone ${isDragging ? 'file-dropzone--dragging' : ''} ${showError ? 'file-dropzone--error' : ''}`}
        htmlFor="contribution-files-input"
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = 'copy';
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(false);
          onAcceptFiles(Array.from(event.dataTransfer.files ?? []));
        }}
      >
        <span className="file-dropzone-icon" aria-hidden="true">
          <AttachFileRounded fontSize="small" />
        </span>
        <span className="file-dropzone-copy">
          <span className="file-dropzone-title">{t('contributionForm.attachFilesAction')}</span>
          <span className="file-dropzone-hint" id="contribution-files-hint">
            {t('contributionForm.attachFilesHint')}
          </span>
        </span>
      </label>
      {showError && (
        <FormHelperText error className="contribution-field-error">
          {error}
        </FormHelperText>
      )}
      {files.length > 0 && (
        <div className="file-list">
          <div className="file-list-head">
            <span className="file-list-title">{t('contributionForm.filesTitle')}</span>
            <span className="file-list-meta">
              {t('contributionForm.filesTotalSize')}: {formatFileSize(totalSize)}
            </span>
          </div>
          <ul className="file-items">
            {files.map((file) => (
              <li className="file-item" key={getFileKey(file)}>
                <span className="file-item-ext" aria-hidden="true">{fileExtension(file.name)}</span>
                <span className="file-item-copy">
                  <span className="file-item-name" title={file.name}>{file.name}</span>
                  <span className="file-item-size">{formatFileSize(file.size)}</span>
                </span>
                <IconButton
                  className="file-item-remove"
                  size="small"
                  aria-label={t('contributionForm.removeFile')}
                  onClick={() => onRemoveFile(file)}
                >
                  <CloseRounded fontSize="small" />
                </IconButton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
