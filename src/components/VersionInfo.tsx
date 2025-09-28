import versionData from '../version.json' with { type: "json" };

interface VersionInfoProps {
  className?: string;
}

export default function VersionInfo({ className = "" }: VersionInfoProps) {
  return (
    <div className={`text-xs text-gray-400 dark:text-gray-500 text-center mt-4 border-t border-gray-200 dark:border-gray-600 pt-2 ${className}`}>
      <span>{versionData.version}</span>
      {versionData.buildType === 'development' && (
        <span className="ml-2 text-orange-500 dark:text-orange-400">({versionData.buildType})</span>
      )}
      {versionData.isDirty && (
        <span className="ml-1 text-red-500 dark:text-red-400">*</span>
      )}
    </div>
  );
}