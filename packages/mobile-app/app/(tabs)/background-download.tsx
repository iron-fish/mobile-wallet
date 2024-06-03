import React, { FC, useEffect, useRef, useState } from 'react'
import { StyleSheet,  FlatList } from 'react-native'
import { Slider, View, Text, } from 'tamagui'
import * as FileSystem from 'expo-file-system';
import {
  completeHandler,
  directories,
  checkForExistingDownloads,
  download,
  setConfig,
  DownloadTask,
} from '@kesha-antonov/react-native-background-downloader'
import { Button } from '@ironfish/ui';

const defaultDir = directories.documents

setConfig(
    {},
    1000,
  true,
)
interface FooterProps {
    onStart: () => void;
    onStop: () => void;
    onReset: () => void;
    onClear: () => void;
    onRead: () => void;
    isStarted: boolean;
    // include other props here
  }

const Footer: FC<FooterProps> = ({
  onStart,
  onStop,
  onReset,
  onClear,
  onRead,
  isStarted,
  ...props
}) => {
  return (
    <View style={styles.headerWrapper} {...props}>
      {isStarted
        ? (
          <Button onPress={onStop} ><Text>Stop</Text></Button>
        )
        : (
          <Button onPress={onStart} ><Text>Start</Text></Button>
        )}

      <Button onPress={onReset} ><Text>Reset</Text></Button>
      <Button onPress={onClear} ><Text>Clear</Text></Button>
      <Button onPress={onRead} ><Text>Read</Text></Button>
    </View>
  )
}

const BasicExampleScreen = () => {
  const [urlList] = useState([
    {
      id: '1',
      url: 'https://sabnzbd.org/tests/internetspeed/20MB.bin',
    },
    {
      id: '2',
      url: 'https://sabnzbd.org/tests/internetspeed/50MB.bin',
    },
    {
      id: '3',
      url: 'https://proof.ovh.net/files/100Mb.dat',
    },
  ])

  const [isStarted, setIsStarted] = useState(false)

  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([])
  const startTimes = useRef<{[key: string]: number}>({});
  const [downloadTimes, setDownloadTimes] = useState<{[key: string]: number}>({});


  /**
   * It is used to resume your incomplete or unfinished downloads.
   */
  const resumeExistingTasks = async () => {
    try {
      const tasks = await checkForExistingDownloads()

      console.log(tasks)

      if (tasks.length > 0) {
        tasks.map(task => process(task))
        setDownloadTasks(downloadTasks => [...downloadTasks, ...tasks])
        setIsStarted(true)
      }
    } catch (e) {
      console.warn('checkForExistingDownloads e', e)
    }
  }

  const readStorage = async () => {
    const files = await FileSystem.readDirectoryAsync(defaultDir)
    console.log(`Downloaded files: ${files}`)
  }

  const clearStorage = async () => {
    const files = await FileSystem.readDirectoryAsync(defaultDir)

    if (files.length > 0)
      await Promise.all(
        files.map(file => FileSystem.deleteAsync(FileSystem.documentDirectory + '/' + file))
    )

    console.log(`Deleted file count: ${files.length}`)
  }

  const process = (task: DownloadTask) => {
    const { index } = getTask(task.id)

    return task
      .begin(({ expectedBytes, headers }) => {
        console.log('task: begin', { id: task.id, expectedBytes, headers })
        setDownloadTasks(downloadTasks => {
          downloadTasks[index] = task
          return [...downloadTasks]
        })
      })
      .progress(({ bytesDownloaded, bytesTotal }) => {
        console.log('task: progress', { id: task.id, bytesDownloaded, bytesTotal })
        setDownloadTasks(downloadTasks => {
          downloadTasks[index] = task
          return [...downloadTasks]
        })
      })
      .done(() => {
        console.log('task: done', { id: task.id })
        console.log('done', Date.now() - startTimes.current[task.id])
        setDownloadTimes({ ...downloadTimes, [task.id]: Date.now() - startTimes.current[task.id] });

        completeHandler(task.id)
      })
      .error(e => {
        console.error('task: error', { id: task.id, e })
        setDownloadTasks(downloadTasks => {
          downloadTasks[index] = task
          return [...downloadTasks]
        })

        completeHandler(task.id)
      })
  }

  const reset = () => {
    stop()
    setDownloadTasks([])
    setIsStarted(false)
  }

  const start = () => {
    /**
     * You need to provide the extension of the file in the destination section below.
     * If you cannot provide this, you may experience problems while using your file.
     * For example; Path + File Name + .png
     */
    const taskAttributes = urlList.map(item => {
      const destination = defaultDir + '/' + item.id
      return {
        id: item.id,
        url: item.url,
        destination,
      }
    })

    const tasks = taskAttributes.map(taskAttribute => {
      startTimes.current[taskAttribute.id] = Date.now();
      return process(download(taskAttribute))
    });

    console.log(JSON.stringify(startTimes))
    setDownloadTasks(downloadTasks => [...downloadTasks, ...tasks])
    setIsStarted(true)
  }

  const stop = () => {
    const tasks = downloadTasks.map(task => {
      task.stop()
      return task
    })

    setDownloadTasks(tasks)
    setIsStarted(false)
  }

  const pause = (id: string) => {
    const { index, task } = getTask(id)

    task.pause()
    setDownloadTasks(downloadTasks => {
      downloadTasks[index] = task
      return [...downloadTasks]
    })
  }

  const resume = (id: string) => {
    const { index, task } = getTask(id)

    task.resume()
    setDownloadTasks(downloadTasks => {
      downloadTasks[index] = task
      return [...downloadTasks]
    })
  }

  const cancel = (id: string) => {
    const { index, task } = getTask(id)

    task.stop()
    setDownloadTasks(downloadTasks => {
      downloadTasks[index] = task
      return [...downloadTasks]
    })
  }

  const getTask = (id: string) => {
    const index = downloadTasks.findIndex(task => task.id === id)
    const task = downloadTasks[index]
    return { index, task }
  }

  useEffect(() => {
    resumeExistingTasks()
  }, [])

  return (
    <View flexGrow={1} backgroundColor={'white'}>
      <Text style={styles.title}>Basic Example</Text>
      <View>
        <FlatList
          data={urlList}
          keyExtractor={(item, index) => `url-${index}`}
          renderItem={({ index, item }) => (
            <View style={styles.item}>
              <View style={styles.itemContent}>
                <Text>Id: {item.id}</Text>
                <Text>Url: {item.url}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={() => (
            <Footer
              isStarted={isStarted}
              onStart={start}
              onStop={stop}
              onReset={reset}
              onClear={clearStorage}
              onRead={readStorage}
            />
          )}
        />
      </View>
      <FlatList
        style={{ flex: 1, flexGrow: 1 }}
        data={downloadTasks}
        renderItem={({ item, index }) => {
          const isEnded = ['STOPPED', 'DONE', 'FAILED'].includes(item.state)
          const isDownloading = item.state === 'DOWNLOADING'

          return (
            <View style={styles.item}>
              <View style={styles.itemContent}>
                <Text>{item?.id}</Text>
                <Text>{item?.state}</Text>
                <Text>{item ? downloadTimes[item.id] : 0} ms</Text>
                <Slider
                  disabled={true}
                  value={[item?.bytesDownloaded]}
                  min={0}
                  max={item?.bytesTotal}
                />
              </View>
              <View>
                {!isEnded &&
                  (isDownloading
                    ? (
                      <Button onPress={() => pause(item.id)} ><Text>Pause</Text></Button>
                    )
                    : (
                      <Button onPress={() => resume(item.id)}> <Text>Resume</Text></Button>
                    ))}
                <Button onPress={() => cancel(item.id)} ><Text>Cancel</Text></Button>
              </View>
            </View>
          )
        }}
        keyExtractor={(item, index) => `task-${index}`}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  headerWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: 16,
  },
  item: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  itemContent: {
    flex: 1,
    flexShrink: 1,
  },
})

export default BasicExampleScreen