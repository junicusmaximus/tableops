import { FileText, Image, Download } from 'lucide-react';

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

const FilePreview = ({ fileUrl, fileName, fileType }: FilePreviewProps) => {
  const isImage = fileType.startsWith('image/');

  if (isImage) {
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-[280px] max-h-[200px] rounded-lg border border-border object-cover cursor-pointer hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </a>
    );
  }

  const isPdf = fileType === 'application/pdf';

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 mt-1.5 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors max-w-[280px]"
    >
      {isPdf ? (
        <FileText className="w-8 h-8 text-destructive shrink-0" />
      ) : (
        <FileText className="w-8 h-8 text-primary shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
        <p className="text-[10px] text-muted-foreground uppercase">{fileType.split('/').pop()}</p>
      </div>
      <Download className="w-4 h-4 text-muted-foreground shrink-0" />
    </a>
  );
};

export default FilePreview;
