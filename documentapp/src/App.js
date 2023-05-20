import './App.scss';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useEffect, useState } from 'react';

import DataTable from 'react-data-table-component';
import { socket1 } from './socket1';
import { socket2 } from './socket2';
// import { socket3 } from './socket3';
// import { socket4 } from './socket4';

import { docs } from './docs';
import { format, parseISO } from 'date-fns';
import Graph from './Graph';

const orgs = [
  {
    name: 'Company 1',
    port: 1000
  },
  // {
  //   name: 'PAN',
  //   port: 2000
  // },
  // {
  //   name: 'CBSE',
  //   port: 4000
  // },
  // {
  //   name: 'Company 2',
  //   port: 8000
  // },
]

const uploadDoc = (doc) => {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify(doc),
    redirect: 'follow'
  };

  fetch("http://localhost:1000/uploadDocument", requestOptions)
    .then(response => response.json())
    // .then(result => console.log(result))
    .catch(error => console.log('error', error));
}

function App() {
  const [logs, setLogs] = useState([])
  const [sentLogs, setSentLogs] = useState([])
  return (
    <div className="App">
      <Graph
      // logs={logs} sentLogs={sentLogs}
      />
      {/* <button onClick={() => { console.log({ logs: logs }) }}>Console.log logs</button>
      <button onClick={() => { console.log({ sentLogs: sentLogs }) }}>Console.log Sent Flogs</button> */}
      <div className='org-container'>
        {orgs.map((org, index) => {
          const { port } = org
          return (
            <Org
              org={org}
              key={port}
              index={index}
              setLogs={setLogs}
              setSentLogs={setSentLogs}
            />
          )
        })}
      </div>
      <ArrayDisplay array={logs} />
    </div>
  );
}

const panSchema = {
  name: "Name",
  father_name: "Fathers Name",
  pan_number: "Pan number",
  dob: "Date of birth"
}

const experienceSchema = {
  name: "Name",
  employee_id: "Employee ID",
  company_name: "Company Name",
  joining_date: "Joining Date",
  tenure: "Tenure",
  manager_name: "Manager Name"
}

const voterSchema = {
  name: "Name",
  voter_id: "Voter ID",
  father_name: "Fathers Name",
  elector_name: "Electors Name",
  dob: "Date of birth"
}

const aadharSchema = {
  name: "Name",
  aadhar_number: "Aadhar Number",
  gender: "Gender",
  dob: "Date of birth",
  address: "Address"
}

const PAN = 'PAN'
const EXPERIENCE = 'Experience'
const AADHAR = 'Aadhar'
const VOTERID = 'Voter'

const wrapPayload = (data, docType) => {
  switch (docType) {
    case PAN: {
      return {
        identifier: "PAN",
        type: "PAN",
        id: data['pan_number'],
        data: data
      }
    }
    case EXPERIENCE: {
      return {
        identifier: "ExperienceCertificate",
        type: "ExperienceCertificate",
        id: data['employee_id'],
        data: data
      }
    }
    case AADHAR: {
      return {
        identifier: "Aadhar",
        type: "Aadhar",
        id: data['aadhar_number'],
        data: data
      }
    }
    case VOTERID: {
      return {
        identifier: "VoterId",
        type: "VoterId",
        id: data['voter_id'],
        data: data
      }
    }
    default: {
      return {
        data: data
      }
    }
  }
}

const typeOfDocs = [
  'PAN', 'Experience', 'Aadhar', 'Voter'
]

const Org = ({ org, index, setLogs, setSentLogs }) => {
  const { name, port } = org
  const isCompany = name.includes('Company')

  const [doc, setDoc] = useState({})
  const [error, setError] = useState('')
  const [docType, setDocType] = useState('PAN')
  const [docModal, setDocModal] = useState(false)

  const [socketId, setSocketId] = useState(null)
  const [buttonClicked, setButtonClicked] = useState([false, false, false, false, false, false, false, false, false, false])

  const socket = [
    socket1,
    socket2,
    // socket3,
    //socket4
  ][index]

  useEffect(() => {
    function onConnect() {
      setSocketId(socket.id)
    }

    function onDisconnect() {
      console.log(name, 'Disconnected')
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('log', (log) => {
      setLogs((prev) => {
        return [
          ...prev,
          {
            ...log,
            time: log.time,
            org: name,
          }
        ]
      })
    })

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('log');
    };
  }, []);

  const idx = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0']

  const panDocsFold = docs.map((document) => {
    const panDocFold = idx.map((x) => {
      const updatedId = document.id + x;
      const updatedPanNumber = updatedId;

      const updatedDocument = {
        ...document,
        id: updatedId,
        data: {
          ...document.data,
          pan_number: updatedPanNumber
        }
      };

      return updatedDocument

    })
    return panDocFold
  })

  const docSchema = {
    [PAN]: panSchema,
    [AADHAR]: aadharSchema,
    [EXPERIENCE]: experienceSchema,
    [VOTERID]: voterSchema
  }[docType]

  return (
    <div className={`org org-${index}`}>
      <h2>{name} : {socketId}</h2>
      {isCompany &&
        <div className='prefill'>
          {panDocsFold.flat(1).slice(0, 4).map((doc, index) => {
            return (
              <button className='single' key={index} onClick={() => {
                setDoc(doc.data)
                // setLogs((prev) => {
                //   return [
                //     ...prev,
                //     {
                //       id: doc.id,
                //       time: new Date().toISOString(),
                //       status: 'Sent for verification',
                //       org: name,
                //     }
                //   ]
                // })
                // uploadDoc(doc)
              }}>
                Prefill {doc.identifier} {doc.id}
              </button>
            )
          })}
          {[
            // 10,
            // 20,
            30,
            // 40, 50, 60, 70, 80, 90, 100
          ].map((numOfDocs, index) => {
            const slices = [[30, 60], [10, 30], [30, 60], [60, 100], [100, 150], [150, 210], [210, 280], [280, 360], [360, 450], [450, 550]]
            return (
              <button
                style={{
                  border: buttonClicked[index] ? '2px solid black' : ''
                }}
                key={numOfDocs}
                onClick={() => {
                  panDocsFold.flat(1).slice(slices[index][0], slices[index][1]).forEach((doc) => {
                    uploadDoc(doc)
                  })
                  let btns = buttonClicked
                  btns[index] = true
                  setButtonClicked(btns)
                  setLogs((prev) => {
                    return [
                      ...prev,
                      {
                        id: `${numOfDocs} docs`,
                        time: new Date().toISOString(),
                        status: 'Sent for verification',
                        org: name,
                      }
                    ]
                  })
                  setSentLogs((prev) => {
                    return [
                      ...prev,
                      {
                        id: numOfDocs,
                        time: new Date().toISOString(),
                        status: 'Sent for verification',
                        org: name,
                      }
                    ]
                  })
                }}>
                Upload {numOfDocs} Docs
              </button>
            )
          })}
        </div>
      }
      {isCompany &&
        <div className='doc'>
          <div className='doc-type'>
            <button
              type='button'
              onClick={() => {
                setDocModal(!docModal)
              }}
            >
              {docType}
            </button>
            {docModal && <div>
              {typeOfDocs.map((typeOfDoc, index) => {
                return (
                  <button
                    type='button'
                    onClick={() => {
                      setDocType(typeOfDoc)
                      setDocModal(false)
                    }}
                    key={index}
                  >
                    {typeOfDoc}
                  </button>
                )
              })}
            </div>
            }
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (Object.keys(docSchema).length === Object.keys(doc).length) {
                setError('')
                const payload = wrapPayload(doc, docType)
                console.log(payload)
                //upload doc
                setLogs((prev) => {
                  return [
                    ...prev,
                    {
                      id: payload.id,
                      time: new Date().toISOString(),
                      status: 'Sent for verification',
                      org: name,
                    }
                  ]
                })
                uploadDoc(payload)
                setDoc({})
              } else {
                setError('Please fill all the fields')
              }
            }}
          >
            {Object.keys(docSchema).map((field => {
              return (
                <div key={docSchema[field]}>
                  <label>
                    {docSchema[field]}
                  </label>
                  <input
                    type='text'
                    value={doc?.[field] ?? ''}
                    onChange={(e) => {
                      setDoc(prev => ({
                        ...prev,
                        [field]: e.target.value
                      }))
                    }}
                  />
                </div>
              )
            }))}
            <button type='submit'>Submit Document</button>
          </form>
          {error !== '' && <div className='error'>{error}</div>}
        </div>
      }
    </div>
  )
}

export default App;

// {
//   isCompany
//     &&
//     <Formik
//       initialValues={{ email: '', password: '' }}
//       validate={values => {
//         const errors = {};
//         if (!values.email) {
//           errors.email = 'Required';
//         } else if (
//           !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
//         ) {
//           errors.email = 'Invalid email address';
//         }
//         return errors;
//       }}
//       onSubmit={(values, { setSubmitting }) => {
//         setTimeout(() => {
//           alert(JSON.stringify(values, null, 2));
//           setSubmitting(false);
//         }, 400);
//       }}
//     >
//       {({ isSubmitting }) => (
//         <Form>
//           <Field type="email" name="email" />
//           <ErrorMessage name="email" component="div" />
//           <Field type="password" name="password" />
//           <ErrorMessage name="password" component="div" />
//           <button type="submit" disabled={isSubmitting}>
//             Submit
//           </button>
//         </Form>
//       )}
//     </Formik>
// }

function ArrayDisplay({ array }) {
  const table = array.map((rr, index) => {
    return {
      ...rr,
      index: index + 1
    }
  })
  const columns = [
    {
      name: 'S.No.',
      selector: row => row.index
    },
    {
      name: 'Time',
      selector: row => row.time,
    },
    {
      name: 'Org',
      selector: row => row.org,
    },
    {
      name: 'ID',
      selector: row => row.id,
    },
    {
      name: 'Status',
      selector: row => row.status,
    },
  ];
  if (array.length) {
    return (
      <div className='table'>
        {/* <h1>Number of docs verified  : {table.length}</h1> */}
        <DataTable
          columns={columns}
          data={table}
        />
      </div>
    );
  }
}