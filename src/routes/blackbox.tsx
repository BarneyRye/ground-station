import { createFileRoute, Link } from '@tanstack/react-router'
import { downloadDir } from '@tauri-apps/api/path'
import { open, save } from '@tauri-apps/plugin-dialog'
import {
  DownloadIcon,
  FileChartColumnIncreasingIcon,
  HardDriveIcon,
  UploadIcon,
} from 'lucide-react'
import { useState } from 'react'
import { blackboxExtract } from '@/api/api'
import { Button } from '@/ui/button'
import { ButtonGroup, ButtonGroupSeparator } from '@/ui/button-group'
import { Card, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/ui/field'
import { Spinner } from '@/ui/spinner'

export const Route = createFileRoute('/blackbox')({
  component: RouteComponent,
})

function RouteComponent() {
  const [log_file, setLogFile] = useState<string>('')
  const [output_file, setOutputFile] = useState<string>('')
  const [extracting, setExtracting] = useState<boolean>(false)

  async function selectFile() {
    const file = await open({
      multiple: false,
      directory: false,
      filters: [{ name: '', extensions: ['bin'] }],
      defaultPath: await downloadDir(),
    })
    file && setLogFile(file)
  }

  async function extractFile() {
    if (log_file.length < 1) return
    const output = await save({
      filters: [
        {
          name: `comma seperated values`,
          extensions: ['csv'],
        },
      ],
      defaultPath: await downloadDir(),
    })
    if (!output) return
    setOutputFile(output)
    setExtracting(true)
    await blackboxExtract(log_file, output_file)
    setExtracting(false)
    setLogFile('')
  }

  async function selectDataFile() {
    const file = await open({
      multiple: false,
      directory: false,
      filters: [{ name: '', extensions: ['csv'] }],
      defaultPath: await downloadDir(),
    })
    file && setOutputFile(file)
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-row flex-wrap gap-10">
        <Link to="/">
          <Card className="w-lg h-full hover:border-primary">
            <CardHeader>
              <CardTitle className="flex flex-row gap-4 items-center justify-center text-primary font-extrabold text-7xl mb-4">
                <HardDriveIcon size="70" strokeWidth={3} />
                Blackbox
              </CardTitle>
              <CardDescription className="text-center">
                Blackbox data extraction, and visualisation from our custom
                flight computers
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Card>
          <Field>
            <FieldLabel className="text-3xl">
              <UploadIcon size="50" />
              Log file location
            </FieldLabel>
            <ButtonGroup>
              <Button
                onClick={selectFile}
                className="bg-foreground border-2 rounded-2xl border-primary min-w-sm justify-start"
              >
                File:{' '}
                <span className="text-muted-foreground">
                  {log_file.length > 0 ? log_file : 'Select a log file'}
                </span>
              </Button>
              <ButtonGroupSeparator />
              <Button
                disabled={!log_file}
                onClick={extractFile}
                className="rounded-2xl w-20"
              >
                {extracting ? <Spinner /> : 'Extract'}
              </Button>
            </ButtonGroup>
            <FieldDescription>
              Select a file and extract to convert and save data
            </FieldDescription>
          </Field>
        </Card>
        <Card>
          <Field>
            <FieldLabel className="text-3xl">
              <FileChartColumnIncreasingIcon size="50" />
              Current Data File
            </FieldLabel>
            <Button
              onClick={selectDataFile}
              className="bg-foreground border-2 rounded-2xl border-primary min-w-sm justify-start"
            >
              File:{' '}
              <span className="text-muted-foreground">
                {output_file.length > 0
                  ? output_file
                  : 'Select a log file'}{' '}
              </span>{' '}
              <DownloadIcon className="ml-auto" />
            </Button>
          </Field>
        </Card>
      </div>
      <Card></Card>
    </div>
  )
}
