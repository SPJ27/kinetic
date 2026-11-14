import React from 'react'

const EnvTextArea = () => {
    return (
        <div>
            <textarea placeholder={'KEY=value\nDATABASE_URL=...'}
                className="w-full rounded-xs border border-neutral-200/60 bg-white px-4 py-3 text-xs text-neutral-600 font-mono focus:outline-none">
            </textarea>

        </div>
    )
}

export default EnvTextArea