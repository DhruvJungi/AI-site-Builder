import React, { useMemo, useState } from 'react'
import { detectDependencies } from '../utils/sandpackUtils';
import SandpackErrorMonitor from './SandpackErrorMonitor';
import { SandpackLayout, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';

const FullPagePreview = ({ files }) => {

    const [showErrorOverlay, setShowErrorOverlay] = useState(true);

    const sandpackFiles = useMemo(() => {
        if (!files) return {};
        const paths = Object.keys(files);
        const activeFile = paths.includes("/App.js") ? "/App.js" : paths[0];
        return Object.fromEntries(paths.map((path) => [path, {
            code: typeof files[path] === "string" ? files[path] : files[path]?.content || "",
            active: path === activeFile,
        }]));
    }, [files]);
    const dependencies = useMemo(() => detectDependencies(files), [files]);


    return (
        <div className="h-screen w-screen bg-white overflow-hidden">
            <SandpackProvider  template="react" files={sandpackFiles} customSetup={{ dependencies }} options={{ externalResources: ["https://cdn.tailwindcss.com"], logLevel: 0 }} className='h-full w-full'>
            
            <SandpackErrorMonitor onErrorChange={setShowErrorOverlay} />
            <SandpackLayout className='h-full w-full border-none! bg-transparent!'>
                
                <SandpackPreview showOpenInCodeSandbox={false} showSandpackErrorOverlay={showErrorOverlay}  
                className='h-full w-full'/>
            </SandpackLayout>
        </SandpackProvider></div>
    )
}

export default FullPagePreview