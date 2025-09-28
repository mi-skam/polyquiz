import versionData from '../version.json' with { type: "json" };

interface VersionInfoProps {
  className?: string;
}

export default function VersionInfo({ className = "" }: VersionInfoProps) {
  return (
    <div className={`text-xs text-gray-400 text-center mt-4 border-t pt-2 ${className}`}>
      <span>v{versionData.version}</span>
      {versionData.buildType === 'development' && (
        <span className="ml-2 text-orange-500">({versionData.buildType})</span>
      )}
      {versionData.isDirty && (
        <span className="ml-1 text-red-500">*</span>
      )}
    </div>
  );
}