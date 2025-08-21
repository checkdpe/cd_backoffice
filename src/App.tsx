import React, { useMemo, useState, useCallback } from 'react'
import { ConfigProvider, App as AntdApp, Layout, Typography, Form, Checkbox, Space, Button, Card, theme, Divider, Row, Col, Tag, Modal, Input, message, Switch, Tabs, Table } from 'antd'
import { EditOutlined, PlusOutlined, DeleteOutlined, ArrowRightOutlined, ArrowLeftOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'

type Level = 0 | 1 | 2

type Choice = {
  id: string
  reference: number
  label: string
  description: string
  checked?: boolean
}

type ApiEntry = {
  label: string
  category: string
  active: boolean
  choices: Choice[]
}

type ScopeItem = {
  id: string
  label: string
  selected: boolean
  description?: string
}

type Simulation = {
  id: string
  active: boolean
  label: string
  description: string | null
  path: string
  choices: Choice[]
  scope?: ScopeItem[]
}

type Entry = {
  id: string
  label: string
  category: string
  path: string
  simul: Simulation[]
  scope?: ScopeItem[]
}

type ResultData = {
  estimated_cost: number
  kwh: number
}

type SimulationListItem = {
  id: number
  ref_ademe: string
  status: string
}

// Interactive House SVG Component
function InteractiveHouse({ hoveredElement }: { hoveredElement: string | null }) {
  const getElementColor = (elementId: string) => {
    if (hoveredElement === elementId) {
      return '#1677ff' // Blue highlight when hovered
    }
    return '#d9d9d9' // Default gray
  }

  const getElementOpacity = (elementId: string) => {
    if (hoveredElement === elementId) {
      return 1 // Full opacity when hovered
    }
    return 0.6 // Reduced opacity when not hovered
  }

  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <svg
        width="160"
        height="200"
        style={{ border: '1px solid #d9d9d9', borderRadius: '6px', backgroundColor: '#fafafa' }}
      >
        {/* House outline */}
        <rect
          x="27"
          y="53"
          width="107"
          height="107"
          fill="none"
          stroke="#333"
          strokeWidth="2"
        />
        
        {/* Roof - highlighted when plancher haut is hovered */}
        <polygon
          points="16,53 80,27 144,53"
          fill="none"
          stroke={getElementColor('floor_high')}
          strokeWidth={hoveredElement === 'floor_high' ? '4' : '2'}
          opacity={getElementOpacity('floor_high')}
        />
        
        {/* Door */}
        <rect
          x="64"
          y="133"
          width="32"
          height="27"
          fill="none"
          stroke={getElementColor('door')}
          strokeWidth={hoveredElement === 'door' ? '4' : '2'}
          opacity={getElementOpacity('door')}
        />
        

        
        {/* Ground floor level - highlighted when plancher bas is hovered */}
        <line
          x1="27"
          y1="160"
          x2="134"
          y2="160"
          stroke={getElementColor('floor_low')}
          strokeWidth={hoveredElement === 'floor_low' ? '4' : '2'}
          opacity={getElementOpacity('floor_low')}
        />
        
        {/* Walls - highlighted when mur is hovered - only vertical lines */}
        <line
          x1="27"
          y1="53"
          x2="27"
          y2="160"
          stroke={getElementColor('wall')}
          strokeWidth={hoveredElement === 'wall' ? '4' : '2'}
          opacity={getElementOpacity('wall')}
        />
        <line
          x1="134"
          y1="53"
          x2="134"
          y2="160"
          stroke={getElementColor('wall')}
          strokeWidth={hoveredElement === 'wall' ? '4' : '2'}
          opacity={getElementOpacity('wall')}
        />
        
        {/* Left window - highlighted when window is hovered */}
        <rect
          x="43"
          y="64"
          width="21"
          height="21"
          fill="none"
          opacity={getElementOpacity('window')}
          stroke={getElementColor('window')}
          strokeWidth={hoveredElement === 'window' ? '2' : '1'}
        />
        
        {/* Right window - bottom edge represents thermal bridge */}
        <rect
          x="96"
          y="64"
          width="21"
          height="21"
          fill="none"
          opacity={hoveredElement === 'thermal_bridge' ? getElementOpacity('thermal_bridge') : getElementOpacity('window')}
          stroke={hoveredElement === 'thermal_bridge' ? getElementColor('thermal_bridge') : getElementColor('window')}
          strokeWidth={hoveredElement === 'thermal_bridge' ? '4' : (hoveredElement === 'window' ? '2' : '1')}
        />
        
        {/* Door - highlighted when porte is hovered */}
        <rect
          x="64"
          y="133"
          width="32"
          height="27"
          fill="none"
          opacity={getElementOpacity('door')}
          stroke={getElementColor('door')}
          strokeWidth={hoveredElement === 'door' ? '4' : '2'}
        />
        
        {/* Labels */}
        <text 
          x="80" 
          y="155" 
          textAnchor="middle" 
          fontSize="10" 
          fill={hoveredElement === 'floor_low' ? '#1677ff' : '#e0e0e0'}
        >
          Plancher Bas
        </text>
        
        {/* Additional labels */}
        <text 
          x="140" 
          y="100" 
          textAnchor="middle" 
          fontSize="10" 
          fill={hoveredElement === 'wall' ? '#1677ff' : '#e0e0e0'}
        >
          Mur
        </text>
        <text 
          x="80" 
          y="50" 
          textAnchor="middle" 
          fontSize="10" 
          fill={hoveredElement === 'floor_high' ? '#1677ff' : '#e0e0e0'}
        >
          Plancher Haut
        </text>
        
        {/* Window and door labels */}
        <text 
          x="53" 
          y="95" 
          textAnchor="middle" 
          fontSize="9" 
          fill={hoveredElement === 'window' ? '#1677ff' : '#e0e0e0'}
        >
          Fenêtre
        </text>
        <text 
          x="80" 
          y="125" 
          textAnchor="middle" 
          fontSize="9" 
          fill={hoveredElement === 'door' ? '#1677ff' : '#e0e0e0'}
        >
          Porte
        </text>
        
        {/* Thermal Bridge label */}
        <text 
          x="107" 
          y="95" 
          textAnchor="middle" 
          fontSize="8" 
          fill={hoveredElement === 'thermal_bridge' ? '#1677ff' : '#e0e0e0'}
        >
          Pont Thermique
        </text>
      </svg>
    </div>
  )
}

// D3 Scatterplot Component
function D3Scatterplot({ 
  data, 
  graphData, 
  selectedSimulId, 
 
}: { 
  data: ResultData[], 
  graphData: any[], 
  selectedSimulId: string | null,

}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, content: string }>({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  })
  
  React.useEffect(() => {
    if (!svgRef.current || data.length === 0) return
    
    // Clear previous content
    const svg = svgRef.current
    svg.innerHTML = ''
    
    // Set up dimensions
    const margin = { top: 40, right: 40, bottom: 60, left: 60 }
    const width = 600 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
    
    // Create SVG group
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('transform', `translate(${margin.left},${margin.top})`)
    svg.appendChild(g)
    
    // Set up scales
    const xScale = (value: number) => {
      const minCost = Math.min(...data.map(d => d.estimated_cost))
      const maxCost = Math.max(...data.map(d => d.estimated_cost))
      return ((value - minCost) / (maxCost - minCost)) * width
    }
    
    const yScale = (value: number) => {
      const minKwh = Math.min(...data.map(d => d.kwh))
      const maxKwh = Math.max(...data.map(d => d.kwh))
      return height - ((value - minKwh) / (maxKwh - minKwh)) * height
    }
    
    // Add axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    xAxis.setAttribute('x1', '0')
    xAxis.setAttribute('y1', height.toString())
    xAxis.setAttribute('x2', width.toString())
    xAxis.setAttribute('y2', height.toString())
    xAxis.setAttribute('stroke', '#ccc')
    xAxis.setAttribute('stroke-width', '1')
    g.appendChild(xAxis)
    
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    yAxis.setAttribute('x1', '0')
    yAxis.setAttribute('y1', '0')
    yAxis.setAttribute('x2', '0')
    yAxis.setAttribute('y2', height.toString())
    yAxis.setAttribute('stroke', '#ccc')
    yAxis.setAttribute('stroke-width', '1')
    g.appendChild(yAxis)
    
    // Add axis labels
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    xLabel.setAttribute('x', (width / 2).toString())
    xLabel.setAttribute('y', (height + margin.bottom - 10).toString())
    xLabel.setAttribute('text-anchor', 'middle')
    xLabel.setAttribute('fill', '#666')
    xLabel.textContent = 'Estimated Cost (€)'
    g.appendChild(xLabel)
    
    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    yLabel.setAttribute('transform', 'rotate(-90)')
    yLabel.setAttribute('x', (-height / 2).toString())
    yLabel.setAttribute('y', '-40')
    yLabel.setAttribute('text-anchor', 'middle')
    yLabel.setAttribute('fill', '#666')
    yLabel.textContent = 'Energy Consumption (kWh)'
    g.appendChild(yLabel)
    
    // Add data points
    data.forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', xScale(point.estimated_cost).toString())
      circle.setAttribute('cy', yScale(point.kwh).toString())
      
      // Check if this dot is the selected one
      const isSelected = selectedSimulId === index.toString()
      
      if (isSelected) {
        // Highlight selected dot
        circle.setAttribute('r', '8')
        circle.setAttribute('fill', '#000000')
        circle.setAttribute('opacity', '1')
        
        // Show selected dot info for floating div
        if (graphData[index]) {
          const item = graphData[index]
          const inputsText = Object.keys(item.inputs).length > 0 
            ? Object.entries(item.inputs).map(([key, value]) => `${key}: ${value}`).join('\n')
            : 'No inputs'
          
          const content = `Inputs:\n${inputsText}\n\nResults:\nep_conso_5_usages_m2: ${item.result.ep_conso_5_usages_m2}\nemission_ges_5_usages_m2: ${item.result.emission_ges_5_usages_m2}`
        }
      } else {
        // Normal dot styling
        circle.setAttribute('r', '6')
        circle.setAttribute('fill', '#1677ff')
        circle.setAttribute('opacity', '0.7')
      }
      
      // Add hover effect with tooltip and click navigation
      circle.addEventListener('mouseenter', (event) => {
        if (!isSelected) {
          circle.setAttribute('r', '8')
          circle.setAttribute('fill', '#ff4d4f')
        }
        circle.style.cursor = 'pointer'
        
        // Show tooltip with inputs and result data
        if (graphData[index]) {
          const item = graphData[index]
          const inputsText = Object.keys(item.inputs).length > 0 
            ? Object.entries(item.inputs).map(([key, value]) => `${key}: ${value}`).join('\n')
            : 'No inputs'
          
          const content = `Inputs:\n${inputsText}\n\nResults:\nep_conso_5_usages_m2: ${item.result.ep_conso_5_usages_m2}\nemission_ges_5_usages_m2: ${item.result.emission_ges_5_usages_m2}`
          
          // Show tooltip
          setTooltip({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            content
          })
        }
      })
      
      circle.addEventListener('mouseleave', () => {
        if (!isSelected) {
          circle.setAttribute('r', '6')
          circle.setAttribute('fill', '#1677ff')
        }
        circle.style.cursor = 'default'
        
        // Hide hover tooltip
        setTooltip({ visible: false, x: 0, y: 0, content: '' })
      })
      
      // Add click event to update simul_id and stay on current tab
      circle.addEventListener('click', () => {
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('simul_id', index.toString())
        // Update URL without causing page navigation
        window.history.replaceState({}, '', currentUrl.toString())
        // Trigger a custom event to notify parent component
        window.dispatchEvent(new CustomEvent('simulationSelected', { 
          detail: { simulId: index.toString() } 
        }))
      })
      
      g.appendChild(circle)
    })
    
    // Add title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    title.setAttribute('x', (width / 2).toString())
    title.setAttribute('y', '-10')
    title.setAttribute('text-anchor', 'middle')
    title.setAttribute('font-size', '16')
    title.setAttribute('font-weight', 'bold')
    title.setAttribute('fill', '#333')
    title.textContent = 'Cost vs Energy Consumption'
    g.appendChild(title)
    
  }, [data, selectedSimulId])
  
  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <svg
        ref={svgRef}
        width="600"
        height="400"
        style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}
      />
      
      {/* Mobile Tooltip (positioned tooltip) */}
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-line',
            zIndex: 1000,
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          {tooltip.content}
        </div>
      )}
      

      
    </div>
  )
}

type LevelsForm = Record<string, Level>

function SettingsPage({ onClose, accessToken }: { onClose: () => void, accessToken: string | null }) {
  const [settings, setSettings] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const frontendVersion = import.meta.env.VITE_FRONT_VERSION || 'unknown'

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    if (!accessToken) {
      message.error('No access token available')
      return
    }

    try {
      const response = await fetch(`https://api-dev.etiquettedpe.fr/backoffice/settings?frontend_version=${frontendVersion}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.status}`)
      }

      const result = await response.json()
      setSettings(result.data || {})

      if (result.data && result.data.lastversion === false) {
        message.warning('Your browser version is outdated. Please hard-refresh your browser (Ctrl+F5 or Cmd+Shift+R) to get the latest version.')
      }
    } catch (error) {
      message.error('Failed to load settings')
    }
  }

  const saveSettings = async () => {
    if (!accessToken) {
      message.error('No access token available')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`)
      }

      message.success('Settings updated successfully')
    } catch (error) {
      message.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <Typography.Title level={4}>Application Settings</Typography.Title>
      
      <div style={{ marginBottom: '16px' }}>
        <Typography.Text type="secondary">
          Frontend Version: {frontendVersion}
        </Typography.Text>
      </div>

      <Form layout="vertical">
        <Form.Item label="3CL Endpoint">
          <Input
            value={settings['3cl_endpoint'] || ''}
            onChange={(e) => setSettings({ ...settings, '3cl_endpoint': e.target.value })}
            placeholder="Enter 3CL endpoint URL"
          />
        </Form.Item>

        <Form.Item label="Last Version">
          <Typography.Text type="secondary">
            {settings.lastversion ? 'Up to date' : 'Outdated - please refresh'}
          </Typography.Text>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              disabled={true}
              title="Save functionality temporarily disabled"
            >
              Save Settings (Disabled)
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

function LevelCheckboxes({ entry, simulationId, cardIndex, resetTrigger, onCheckboxChange, onLabelUpdate, accessToken, refAdeme, selectedChoices, isReadOnly, openStepInfoModal }: {
  entry: Entry
  simulationId: string
  cardIndex: number
  resetTrigger: number
  onCheckboxChange: (entryId: string, simulationId: string, checkedValues: Level[]) => void
  onLabelUpdate: (entryId: string, simulationId: string, choiceIndex: number, newLabel: string) => void
  accessToken: string | null
  refAdeme: string | null
  selectedChoices: number[] | null
  isReadOnly: boolean
  openStepInfoModal: (entryId: string, simulationId: string, stepIndex: number) => void
}) {
  // Initialize checked values based on API data
  const getInitialCheckedValues = (): Level[] => {
    const checked: Level[] = [0] // Always start with Level 0 (valeur courante)
    
    // Add other levels based on API checked property from specific simulation
    const simulation = entry.simul.find(simul => simul.id === simulationId)
    if (simulation?.choices?.[0]?.checked) checked.push(1)
    if (simulation?.choices?.[1]?.checked) checked.push(2)
    
    return checked
  }
  
  const [checkedValues, setCheckedValues] = useState<Level[]>(getInitialCheckedValues())
  const [isLevelModalVisible, setIsLevelModalVisible] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [jsonData, setJsonData] = useState<any>({})
  const [jsonText, setJsonText] = useState<string>('{}')
  const [humanReadable, setHumanReadable] = useState<string>('')

  const handleCheckboxChange = (level: Level, checked: boolean) => {
    let newCheckedValues: Level[]
    if (checked) {
      newCheckedValues = [...checkedValues, level]
    } else {
      newCheckedValues = checkedValues.filter(v => v !== level)
    }
    
    // Update local state
    setCheckedValues(newCheckedValues)
    
    // Immediately report to parent
    onCheckboxChange(entry.id, simulationId, newCheckedValues)
  }



  // Reset checkbox state when reset is triggered
  React.useEffect(() => {
    setCheckedValues(getInitialCheckedValues())
    setJsonData({})
    setJsonText('{}')
    setHumanReadable('')
  }, [resetTrigger])

  // Report checkbox state changes to parent
  React.useEffect(() => {
    onCheckboxChange(entry.id, simulationId, checkedValues)
  }, [checkedValues, entry.id, simulationId, onCheckboxChange])

  const openLevelModal = async (level: Level) => {
    setSelectedLevel(level)
    setIsLevelModalVisible(true)
    
    try {
      // Get the current choice to determine the alt parameter
      const choiceIndex = level === 1 ? 0 : 1
      const currentChoice = entry.simul.find(simul => simul.id === simulationId)?.choices?.[choiceIndex]
      
      if (!currentChoice) {
        throw new Error('Choice not found')
      }
      
      // Make real API call to get the configuration data
      // Use choice ID as the alt parameter
      
      // Use choice_id as alt parameter to track which choice was selected
      const response = await fetch(`https://api-dev.etiquettedpe.fr/backoffice/simul_setting_edit?element=${entry.id}&alt=${currentChoice.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const apiResponse = await response.json()
      
      // Pre-initialize the JSON editor with real API data
      setJsonData(apiResponse.json_action || {})
      setJsonText(JSON.stringify(apiResponse.json_action || {}, null, 2))
      setHumanReadable(apiResponse.human_readable || '')
      
    } catch (error) {
      message.error('Failed to load configuration data')
      // Fallback to empty JSON
      setJsonData({})
      setJsonText('{}')
      setHumanReadable('')
    }
  }

  return (
    <Form.Item name={entry.id}>
      <Space direction="vertical">
        <Checkbox 
          disabled={true || isReadOnly} 
          checked={checkedValues.includes(0)}
          onChange={(e) => handleCheckboxChange(0, e.target.checked)}
        >
          <Space>
            <span style={{
              border: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 0 ? '3px solid #000' : 'none',
              padding: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 0 ? '2px 4px' : '0',
              borderRadius: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 0 ? '4px' : '0',
              fontWeight: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 0 ? 'bold' : 'normal'
            }}>
              valeur courante
            </span>
            {selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 0 && (
              <EyeOutlined 
                style={{ 
                  fontSize: '12px', 
                  color: '#000000', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease',
                  marginLeft: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openStepInfoModal(entry.id, simulationId, 0)
                }}
                title="View step details"
              />
            )}
          </Space>
        </Checkbox>
        <Checkbox 
          disabled={!checkedValues.includes(0) || isReadOnly}
          checked={checkedValues.includes(1)}
          onChange={(e) => handleCheckboxChange(1, e.target.checked)}
        >
          <Space>
            <span style={{
              backgroundColor: isLevelModalVisible && selectedLevel === 1 ? '#bae7ff' : 'transparent',
              border: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 1 ? '3px solid #000' : (isLevelModalVisible && selectedLevel === 1 ? '1px solid #1890ff' : '1px solid transparent'),
              padding: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 1 ? '4px 8px' : '2px 6px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              fontWeight: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 1 ? 'bold' : (isLevelModalVisible && selectedLevel === 1 ? '500' : 'normal')
            }}>
              {entry.simul.find(simul => simul.id === simulationId)?.choices?.[0]?.label || 'Level 1'}
            </span>
            {!isReadOnly && (
              <EditOutlined 
                style={{ 
                  fontSize: '12px', 
                  color: '#8c8c8c', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openLevelModal(1)
                }}
              />
            )}
            {selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 1 && (
              <EyeOutlined 
                style={{ 
                  fontSize: '12px', 
                  color: '#000000', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease',
                  marginLeft: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openStepInfoModal(entry.id, simulationId, 1)
                }}
                title="View step details"
              />
            )}
          </Space>
        </Checkbox>
        <Checkbox 
          disabled={!checkedValues.includes(0) || isReadOnly}
          checked={checkedValues.includes(2)}
          onChange={(e) => handleCheckboxChange(2, e.target.checked)}
        >
          <Space>
            <span style={{
              backgroundColor: isLevelModalVisible && selectedLevel === 2 ? '#bae7ff' : 'transparent',
              border: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 2 ? '3px solid #000' : (isLevelModalVisible && selectedLevel === 2 ? '1px solid #1890ff' : '1px solid transparent'),
              padding: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 2 ? '4px 8px' : '2px 6px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              fontWeight: selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 2 ? 'bold' : (isLevelModalVisible && selectedLevel === 2 ? '500' : 'normal')
            }}>
              {entry.simul.find(simul => simul.id === simulationId)?.choices?.[1]?.label || 'Level 2'}
            </span>
            {!isReadOnly && (
              <EditOutlined 
                style={{ 
                  fontSize: '12px', 
                  color: '#8c8c8c', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openLevelModal(2)
                }}
              />
            )}
            {selectedChoices && Array.isArray(selectedChoices) && selectedChoices[cardIndex] === 2 && (
              <EyeOutlined 
                style={{ 
                  fontSize: '12px', 
                  color: '#000000', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease',
                  marginLeft: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openStepInfoModal(entry.id, simulationId, 2)
                }}
                title="View step details"
              />
            )}
          </Space>
        </Checkbox>

      </Space>
      
      <Modal
        title={
          <span>
            Configure {entry.label} -{' '}
            <span style={{
              backgroundColor: '#bae7ff',
              border: '1px solid #1890ff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              {entry.simul.find(simul => simul.id === simulationId)?.choices?.[selectedLevel === 1 ? 0 : 1]?.label || `Level ${selectedLevel}`}
            </span>
          </span>
        }
        open={isLevelModalVisible}
        onCancel={() => {
          // Just close the modal without saving
          setIsLevelModalVisible(false)
          setSelectedLevel(null)
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsLevelModalVisible(false)
            setSelectedLevel(null)
          }}>
            Cancel
          </Button>,
          <Button 
            key="ok" 
            type="primary" 
            onClick={async () => {
              try {
                // Get current label and choice data
                // Find the simulation and its choices
                const simulation = entry.simul.find(simul => simul.id === simulationId)
                if (!simulation || !simulation.choices) {
                  throw new Error('Simulation or choices not found')
                }
                
                // We need to map selectedLevel to the correct choice ID from init endpoint
                // Level 1 should use choices[0].id, Level 2 should use choices[1].id
                const choiceIndex = selectedLevel === 1 ? 0 : 1
                const selectedChoice = simulation.choices[choiceIndex]
                
                if (!selectedChoice) {
                  throw new Error(`Choice not found for level ${selectedLevel}`)
                }
                
                // Use the actual choice ID from the init endpoint
                const altValue = selectedChoice.id
                
                if (altValue === undefined) {
                  throw new Error('No choice ID found in selected choice')
                }
                
                const postData = {
                  label: selectedChoice?.label || '',
                  description: humanReadable || '',
                  modifier_rule: jsonData,
                  level: selectedLevel,
                  // Note: element and alt are URL parameters, not in body
                }
                
                // Make the actual POST call to simul_setting_edit endpoint
                // Note: element should be an int, alt should be a string
                // Map string IDs to numeric IDs for the API
                const elementIdMap: Record<string, number> = {
                  'wall': 1,
                  'floor_low': 2,
                  'floor_high': 3,
                  'baie_vitree': 4,
                  'porte': 5,
                  'ets': 6,
                  'pont_thermique': 7
                }
                
                const elementId = elementIdMap[entry.id] || 0
                
                if (!refAdeme) {
                  message.error('No ref_ademe available')
                  return
                }
                
                // Use choice_id as alt parameter to track which choice was selected
                const response = await fetch(`https://api-dev.etiquettedpe.fr/backoffice/simul_setting_edit?ref_ademe=${refAdeme}&element=${elementId}&alt=${selectedChoice.id}`, {
                  method: 'PATCH',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: JSON.stringify(postData)
                })
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`)
                }
                
                const result = await response.json()
                
                message.success('Configuration saved successfully')
                
                // Close modal after successful save
                setIsLevelModalVisible(false)
                setSelectedLevel(null)
                
                    } catch (error) {
        message.error('Failed to save configuration')
      }
            }}
          >
            OK
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong>Configuration for {entry.label} - {entry.simul.find(simul => simul.id === simulationId)?.choices?.[selectedLevel === 1 ? 0 : 1]?.label || `Level ${selectedLevel}`}</Typography.Text>
          {humanReadable && (
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary">
                <strong>Description:</strong> {humanReadable}
              </Typography.Text>
            </div>
          )}
        </div>
        
        {/* Label Input */}
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong>Label:</Typography.Text>
          <Input
            value={entry.simul.find(simul => simul.id === simulationId)?.choices?.[selectedLevel === 1 ? 0 : 1]?.label || ''}
            placeholder="Enter label for this level"
            style={{ marginTop: 8 }}
            onChange={(e) => {
              const newLabel = e.target.value
              const choiceIndex = selectedLevel === 1 ? 0 : 1
              onLabelUpdate(entry.id, simulationId, choiceIndex, newLabel)
            }}
          />
        </div>
        
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
          <Input.TextArea
            value={jsonText}
            onChange={(e) => {
              const newValue = e.target.value
              setJsonText(newValue)
              try {
                const parsed = JSON.parse(newValue)
                setJsonData(parsed)
              } catch (error) {
                // Invalid JSON - just keep the text, don't update jsonData
                // This allows free editing
              }
            }}
            style={{ 
              height: '300px', 
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
            placeholder="Enter JSON configuration..."
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            Enter valid JSON configuration for this level
          </Typography.Text>
        </div>
      </Modal>
    </Form.Item>
  )
}

export default function App() {
  const [form] = Form.useForm<LevelsForm>()
  const [entries, setEntries] = useState<Entry[]>([])
  const [values, setValues] = useState<LevelsForm>({})
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [newEntryName, setNewEntryName] = useState('')
  const [isSettingEditModalVisible, setIsSettingEditModalVisible] = useState(false)
  const [selectedSetting, setSelectedSetting] = useState<{ entryId: string; simulationId: string } | null>(null)
  const [settingLabel, setSettingLabel] = useState('')
  const [settingPath, setSettingPath] = useState('')
  const [settingJsonText, setSettingJsonText] = useState('')
  const [settingJsonData, setSettingJsonData] = useState<any>(null)
  const [isElementPathModalVisible, setIsElementPathModalVisible] = useState(false)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [elementPath, setElementPath] = useState('')
  const [refAdeme, setRefAdeme] = useState<string | null>('') // Will be extracted from URL
  const [loading, setLoading] = useState(true)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [checkboxStates, setCheckboxStates] = useState<Record<string, Level[]>>({})
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<Record<string, boolean>>({})
  const [editingSimulLabels, setEditingSimulLabels] = useState<Record<string, string>>({})
  const [editingSimulDescriptions, setEditingSimulDescriptions] = useState<Record<string, string>>({})
  const [simulationsList, setSimulationsList] = useState<SimulationListItem[]>([])
  const [isNewProjectModalVisible, setIsNewProjectModalVisible] = useState(false)
  const [newProjectRefAdeme, setNewProjectRefAdeme] = useState('')

  const [homeEditMode, setHomeEditMode] = useState(false)
  const [homeViewMode, setHomeViewMode] = useState<'cards' | 'table'>('cards')
  const [graphData, setGraphData] = useState<Array<{id: string, inputs: any, result: {ep_conso_5_usages_m2: number, emission_ges_5_usages_m2: number}}>>([])
  const [activeTab, setActiveTab] = useState<string>('form')
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage for existing authentication
    const stored = localStorage.getItem('auth_state')
    if (stored) {
      try {
        const authData = JSON.parse(stored)
        // Check if token is still valid (not expired)
        if (authData.accessToken && authData.expiresAt && new Date() < new Date(authData.expiresAt)) {
          return true
        } else {
          // Token expired, clear storage
          localStorage.removeItem('auth_state')
        }
      } catch (e) {
        localStorage.removeItem('auth_state')
      }
    }
    return false
  })
  
  const [userInfo, setUserInfo] = useState<any>(() => {
    const stored = localStorage.getItem('auth_state')
    if (stored) {
      try {
        const authData = JSON.parse(stored)
        if (authData.userInfo && authData.expiresAt && new Date() < new Date(authData.expiresAt)) {
          return authData.userInfo
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    return null
  })
  
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('auth_state')
    if (stored) {
      try {
        const authData = JSON.parse(stored)
        if (authData.accessToken && authData.expiresAt && new Date() < new Date(authData.expiresAt)) {
          return authData.accessToken
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    return null
  })
  
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedSimulId, setSelectedSimulId] = useState<string | null>(null)
  const [selectedSimulationData, setSelectedSimulationData] = useState<{
    status: string,
    data?: {
      choices?: number[],
      inputs?: any,
      outputs?: any
    }
  } | null>(null)

  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false)
  const [isDeleteSimulationModalVisible, setIsDeleteSimulationModalVisible] = useState(false)
  const [simulationToDelete, setSimulationToDelete] = useState<{ entryId: string; simulationId: string; simulationName: string } | null>(null)
  const [addingScenario, setAddingScenario] = useState<Record<string, boolean>>({})
  const [attachingScope, setAttachingScope] = useState<Record<string, boolean>>({})
  
  // Step info modal state
  const [isStepInfoModalVisible, setIsStepInfoModalVisible] = useState(false)
  const [stepInfoData, setStepInfoData] = useState<any>(null)
  const [stepInfoLoading, setStepInfoLoading] = useState(false)
  
  // Simulation max ID state - calculated from graph data length minus 1
  const [simulMaxId, setSimulMaxId] = useState<string | null>(null)
  
  const hasProcessedCode = React.useRef(false)
  const simulMaxIdRef = React.useRef<string | null>(null)
  
  // Update simulMaxId when graphData changes
  React.useEffect(() => {
    if (graphData && graphData.length > 0) {
      const maxId = graphData.length.toString()
      setSimulMaxId(maxId)
      simulMaxIdRef.current = maxId
    } else {
      setSimulMaxId(null)
      simulMaxIdRef.current = null
    }
  }, [graphData])
  
  // Sync selectedSimulId with URL parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const simulId = urlParams.get('simul_id')
    setSelectedSimulId(simulId)
    // When simulId exists with refAdeme, fetch simulation details
    if (simulId && refAdeme && accessToken && simulMaxId) {
      ;(async () => {
        try {
          const response = await fetch(`https://api-dev.etiquettedpe.fr/backoffice/simul_simul?ref_ademe=${refAdeme}&simul_id=${simulId}${simulMaxId ? `&simul_max_id=${simulMaxId}` : ''}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          if (!response.ok) throw new Error(`Failed: ${response.status}`)
          const result = await response.json()
          setSelectedSimulationData(result)
        } catch (e) {
          setSelectedSimulationData(null)
        }
      })()
    } else if (!simulId) {
      setSelectedSimulationData(null)
    }
  }, [window.location.search, refAdeme, accessToken, simulMaxId])
  
  // Listen for simulation selection events from D3Scatterplot
  React.useEffect(() => {
    const handleSimulationSelected = (event: CustomEvent) => {
      const { simulId } = event.detail
      setSelectedSimulId(simulId)
      
      // Fetch simulation data for the selected simulation
      if (simulId && refAdeme && accessToken && simulMaxIdRef.current) {
        ;(async () => {
          try {
            const response = await fetch(`https://api-dev.etiquettedpe.fr/backoffice/simul_simul?ref_ademe=${refAdeme}&simul_id=${simulId}${simulMaxIdRef.current ? `&simul_max_id=${simulMaxIdRef.current}` : ''}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            })
            if (!response.ok) throw new Error(`Failed: ${response.status}`)
            const result = await response.json()
            setSelectedSimulationData(result)
                  } catch (e) {
          setSelectedSimulationData(null)
        }
        })()
      }
    }
    
    window.addEventListener('simulationSelected', handleSimulationSelected as EventListener)
    
    return () => {
      window.removeEventListener('simulationSelected', handleSimulationSelected as EventListener)
    }
  }, [refAdeme, accessToken])
  
  // Save authentication state to localStorage
  const saveAuthState = (token: string, user: any) => {
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now
    const authData = {
      accessToken: token,
      userInfo: user,
      expiresAt: expiresAt.toISOString()
    }
    localStorage.setItem('auth_state', JSON.stringify(authData))
  }
  
  // Clear authentication state from localStorage
  const clearAuthState = () => {
    localStorage.removeItem('auth_state')
  }

  const fetchSimulationsList = React.useCallback(async () => {
    try {
      const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_list')
      if (!response.ok) {
        throw new Error(`Failed to fetch simulations list: ${response.status}`)
      }
      const result = await response.json()
      
      // Extract the data array from the response structure
      if (result.status === 'success' && Array.isArray(result.data)) {
        setSimulationsList(result.data)
      } else {
        throw new Error('Invalid response structure')
      }
    } catch (error) {
      // Fallback to mock data if API fails
      const mockData = [
        {"id": 1, "ref_ademe": "2508E0243162W", "status": "running"},
        {"id": 2, "ref_ademe": "2508E0243162X", "status": "completed"},
        {"id": 3, "ref_ademe": "2508E0243162Y", "status": "failed"},
      ]
      setSimulationsList(mockData)
    }
  }, [])

  const fetchGraphData = React.useCallback(async (dpeId: string) => {
    try {
      const response = await fetch(`https://api-dev.etiquettedpe.fr/backoffice/simul_graph?dpe_id=${dpeId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch graph data: ${response.status}`)
      }
      const result = await response.json()
      
      if (result.data && Array.isArray(result.data)) {
        setGraphData(result.data)
      } else {
        throw new Error('Invalid graph response structure')
      }
    } catch (error) {
      message.error('Failed to load graph data')
    }
  }, [])

  const navigateToSimulation = (refAdeme: string) => {
    window.location.href = `/${refAdeme}`
  }

  const createNewProject = async () => {
    try {
      if (!newProjectRefAdeme.trim()) {
        message.error('Please enter a reference for the new project')
        return
      }

      // Validate ref_ademe format (13 characters, alphanumeric)
      if (!/^[A-Z0-9]{13}$/.test(newProjectRefAdeme.trim())) {
        message.error('Reference must be exactly 13 characters long and contain only uppercase letters and numbers')
        return
      }

      // Call simul_new endpoint
      const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref_ademe: newProjectRefAdeme.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to create project: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      message.success('New project created successfully!')
      
      // Refresh the simulations list to include the new project
      await fetchSimulationsList()
      
      // Close modal and reset form
      setIsNewProjectModalVisible(false)
      setNewProjectRefAdeme('')
      
      // Navigate to the new project
      navigateToSimulation(newProjectRefAdeme.trim())
      
    } catch (error) {
      message.error('Failed to create new project')
    }
  }

  const handleDeleteProject = async (refAdeme: string) => {
    try {
      const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref_ademe: refAdeme
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        message.error(`Failed to delete project: ${response.status}`)
        return
      }

      message.success('Project deleted successfully!')
      
      // Refresh the simulations list
      fetchSimulationsList()
      
    } catch (error) {
      message.error('Failed to delete project')
    }
  }

  // Results data for the scatterplot - initialized from API graph data
  const mockResults = useMemo(() => {
    if (graphData.length === 0) {
      // Fallback to mock data if no graph data available
      return [
        {"estimated_cost": 1000, "kwh": 234},
        {"estimated_cost": 2000, "kwh": 224},
        {"estimated_cost": 3000, "kwh": 214}
      ]
    }
    
    // Transform graph data to match the scatterplot format
    return graphData.map((item, index) => ({
      estimated_cost: index * 1000, // Use index as x-axis (0, 1000, 2000, 3000, etc.)
      kwh: item.result.ep_conso_5_usages_m2 // Use energy consumption as y-axis
    }))
  }, [graphData])
  
  // Mock scope data for entries (in production, this comes from API)
  const mockScopeData = {
    "wall": [
      {"id": "0", "label": "ne", "selected": false, "description": "Nord-Est orientation"},
      {"id": "1", "label": "nord", "selected": false, "description": "North orientation"},
      {"id": "2", "label": "est", "selected": true, "description": "East orientation"},
      {"id": "3", "label": "sud", "selected": false, "description": "South orientation"},
      {"id": "4", "label": "ouest", "selected": false, "description": "West orientation"},
      {"id": "5", "label": "plafond", "selected": true, "description": "Ceiling surface"}
    ],
    "floor_low": [
      {"id": "0", "label": "ne", "selected": true, "description": "Nord-Est orientation"},
      {"id": "1", "label": "nord", "selected": false, "description": "North orientation"},
      {"id": "2", "label": "est", "selected": false, "description": "East orientation"},
      {"id": "3", "label": "sud", "selected": true, "description": "South orientation"},
      {"id": "4", "label": "ouest", "selected": false, "description": "West orientation"},
      {"id": "5", "label": "plafond", "selected": false, "description": "Ceiling surface"}
    ],
    "floor_high": [
      {"id": "0", "label": "ne", "selected": false, "description": "Nord-Est orientation"},
      {"id": "1", "label": "nord", "selected": true, "description": "North orientation"},
      {"id": "2", "label": "est", "selected": false, "description": "East orientation"},
      {"id": "3", "label": "sud", "selected": false, "description": "South orientation"},
      {"id": "4", "label": "ouest", "selected": true, "description": "West orientation"},
      {"id": "5", "label": "plafond", "selected": false, "description": "Ceiling surface"}
    ]
  }

  const handleCheckboxChange = (entryId: string, simulationId: string, checkedValues: Level[]) => {
    const combinedKey = `${entryId}_${simulationId}`
    setCheckboxStates(prev => {
      const newState = {
        ...prev,
        [combinedKey]: checkedValues
      }
      return newState
    })
  }

  // Mock API data for development
  const mockApiData = {
    "wall": {
      "label": "mur",
      "category": "enveloppe",
      "path": "/config/wall",
      "simul": [
        {
          "id": "simul_wall_001",
          "active": true,
          "label": "Simulation Mur Standard",
          "description": "Configuration standard pour l'isolation du mur",
          "path": "/config/wall/standard",
          "scope": [
            {"id": "0", "label": "ne", "selected": false, "description": "Nord-Est orientation"},
            {"id": "1", "label": "nord", "selected": false, "description": "North orientation"},
            {"id": "2", "label": "est", "selected": true, "description": "East orientation"},
            {"id": "3", "label": "sud", "selected": false, "description": "South orientation"},
            {"id": "4", "label": "ouest", "selected": false, "description": "West orientation"},
            {"id": "5", "label": "plafond", "selected": true, "description": "Ceiling surface"}
          ],
          "choices": [
            {
              "id": 0,
              "label": "épaisseur divisée par 2",
              "description": "Cette option réduit l'épaisseur du mur de moitié.",
              "checked": true
            },
            {
              "id": 1,
              "label": "épaisseur de 5cm",
              "description": "Cette option fixe l'épaisseur du mur à 5cm.",
              "checked": true
            }
          ]
        },
        {
          "id": "simul_wall_002",
          "active": true,
          "label": "Simulation Mur Avancée",
          "description": "Configuration avancée pour l'isolation du mur",
          "path": "/config/wall/advanced",
          "scope": [
            {"id": "0", "label": "ne", "selected": true, "description": "Nord-Est orientation"},
            {"id": "1", "label": "nord", "selected": false, "description": "North orientation"},
            {"id": "2", "label": "est", "selected": false, "description": "East orientation"},
            {"id": "3", "label": "sud", "selected": true, "description": "South orientation"},
            {"id": "4", "label": "ouest", "selected": false, "description": "West orientation"},
            {"id": "5", "label": "plafond", "selected": false, "description": "Ceiling surface"}
          ],
          "choices": [
            {
              "id": 0,
              "label": "épaisseur optimisée",
              "description": "Cette option optimise l'épaisseur du mur.",
              "checked": false
            },
            {
              "id": 1,
              "label": "épaisseur renforcée",
              "description": "Cette option renforce l'épaisseur du mur.",
              "checked": true
            }
          ]
        }
      ]
    },
    "floor_low": {
      "label": "plancher bas",
      "category": "enveloppe",
      "path": "/config/floor_low",
      "simul": [
        {
          "id": "simul_floor_low_001",
          "active": true,
          "label": "Simulation Plancher Bas",
          "description": "Configuration pour l'isolation du plancher bas",
          "path": "/config/floor_low/standard",
          "scope": [
            {"id": "0", "label": "ne", "selected": true, "description": "Nord-Est orientation"},
            {"id": "1", "label": "nord", "selected": false, "description": "North orientation"},
            {"id": "2", "label": "est", "selected": false, "description": "East orientation"},
            {"id": "3", "label": "sud", "selected": true, "description": "South orientation"},
            {"id": "4", "label": "ouest", "selected": false, "description": "West orientation"},
            {"id": "5", "label": "plafond", "selected": false, "description": "Ceiling surface"}
          ],
          "choices": [
            {
              "id": 0,
              "label": "épaisseur divisée par 2",
              "description": "Cette option réduit l'épaisseur du plancher bas de moitié.",
              "checked": true
            },
            {
              "id": 1,
              "label": "épaisseur de 5cm",
              "description": "Cette option fixe l'épaisseur du plancher bas à 5cm.",
              "checked": false
            }
          ]
        }
      ]
    },
    "floor_high": {
      "label": "plancher haut",
      "category": "enveloppe",
      "path": "/config/floor_high",
      "simul": [
        {
          "id": "simul_floor_high_001",
          "active": false,
          "label": "Simulation Plancher Haut",
          "description": "Configuration pour l'isolation du plancher haut",
          "path": "/config/floor_high/standard",
          "scope": [
            {"id": "0", "label": "ne", "selected": false, "description": "Nord-Est orientation"},
            {"id": "1", "label": "nord", "selected": true, "description": "North orientation"},
            {"id": "2", "label": "est", "selected": false, "description": "East orientation"},
            {"id": "3", "label": "sud", "selected": false, "description": "South orientation"},
            {"id": "4", "label": "ouest", "selected": true, "description": "West orientation"},
            {"id": "5", "label": "plafond", "selected": false, "description": "Ceiling surface"}
          ],
          "choices": [
            {
              "id": 0,
              "label": "épaisseur divisée par 2",
              "description": "Cette option réduit l'épaisseur du plancher haut de moitié.",
              "checked": false
            },
            {
              "id": 1,
              "label": "épaisseur de 5cm",
              "description": "Cette option fixe l'épaisseur du plancher haut à 5cm.",
              "checked": false
            }
          ]
        }
      ]
    },
    "baie_vitree": {
      "label": "fenêtre",
      "category": "enveloppe",
      "path": "/config/baie_vitree",
      "simul": [
        {
          "id": "simul_baie_vitree_001",
          "active": true,
          "label": "Simulation Fenêtre Standard",
          "description": "Configuration standard pour l'isolation des fenêtres",
          "path": "/config/baie_vitree/standard",
          "scope": [
            {"id": "0", "label": "ne", "selected": false, "description": "Nord-Est orientation"},
            {"id": "1", "label": "nord", "selected": false, "description": "North orientation"},
            {"id": "2", "label": "est", "selected": true, "description": "East orientation"},
            {"id": "3", "label": "sud", "selected": false, "description": "South orientation"},
            {"id": "4", "label": "ouest", "selected": true, "description": "West orientation"},
            {"id": "5", "label": "plafond", "selected": false, "description": "Ceiling surface"}
          ],
          "choices": [
            {
              "id": 0,
              "label": "double vitrage",
              "description": "Cette option améliore l'isolation des fenêtres.",
              "checked": true
            },
            {
              "id": 1,
              "label": "triple vitrage",
              "description": "Cette option optimise l'isolation des fenêtres.",
              "checked": false
            }
          ]
        }
      ]
    },
    "porte": {
      "label": "porte",
      "category": "enveloppe",
      "path": "/config/porte",
      "simul": [
        {
          "id": "simul_porte_001",
          "active": true,
          "label": "Simulation Porte Standard",
          "description": "Configuration standard pour l'isolation des portes",
          "path": "/config/porte/standard",
          "scope": [
            {"id": "0", "label": "ne", "selected": false, "description": "Nord-Est orientation"},
            {"id": "1", "label": "nord", "selected": false, "description": "North orientation"},
            {"id": "2", "label": "est", "selected": true, "description": "East orientation"},
            {"id": "3", "label": "sud", "selected": false, "description": "South orientation"},
            {"id": "4", "label": "ouest", "selected": true, "description": "West orientation"},
            {"id": "5", "label": "plafond", "selected": false, "description": "Ceiling surface"}
          ],
          "choices": [
            {
              "id": 0,
              "label": "isolation renforcée",
              "description": "Cette option améliore l'isolation des portes.",
              "checked": true
            },
            {
              "id": 1,
              "label": "double isolation",
              "description": "Cette option optimise l'isolation des portes.",
              "checked": false
            }
          ]
        }
      ]
    }
  }

  const initializeForm = async () => {
    try {
      setLoading(true)
      
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      // Call the real API endpoint with Cognito token and ref_ademe as query parameter
      if (!refAdeme) {
        throw new Error('No ref_ademe available. Please check the URL path.')
      }
      
      const response = await fetch(`https://api-dev.etiquettedpe.fr/backoffice/simul_init?ref_ademe=${refAdeme}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const apiData = await response.json()
      
      // Transform API data to Entry format
      const transformedEntries: Entry[] = Object.entries(apiData).map(([key, value]: [string, any]) => {
        const entry = {
          id: key,
          label: value.label,
          category: value.category === 'enveloppe' ? 'Enveloppe' : value.category,
          path: value.path || `/config/${key}`,
          simul: (value.simul || []).map((simul: any) => {
            return {
              ...simul,
              // Ensure scope has the correct structure with selected state
              scope: (simul.scope || []).map((scopeItem: any) => {
                return {
                  id: scopeItem.id || scopeItem.label,
                  label: scopeItem.label || scopeItem.id,
                  description: scopeItem.description,
                  selected: scopeItem.selected || false
                }
              })
            }
          })
        }
        return entry
      })
      
      setEntries(transformedEntries)
      
      // Initialize form values based on checked choices from first simulation
      const initialValues: LevelsForm = {}
      transformedEntries.forEach(entry => {
        const firstSimul = entry.simul[0]
        if (firstSimul && firstSimul.choices) {
          const checkedChoiceIndex = firstSimul.choices.findIndex(choice => choice.checked)
          initialValues[entry.id] = checkedChoiceIndex >= 0 ? (checkedChoiceIndex + 1) as Level : 0
        } else {
          initialValues[entry.id] = 0
        }
      })
      setValues(initialValues)
      form.setFieldsValue(initialValues)
      
      // Initialize checkbox states based on API data from ALL simulations
      const initialCheckboxStates: Record<string, Level[]> = {}
      transformedEntries.forEach(entry => {
        // Initialize each simulation separately
        entry.simul.forEach(simul => {
          if (simul.active && simul.choices) {
            const combinedKey = `${entry.id}_${simul.id}`
            const checkedLevels: Level[] = [0] // Always start with Level 0
            
            simul.choices.forEach((choice, index) => {
              if (choice.checked) {
                checkedLevels.push(index + 1 as Level)
              }
            })
            
            initialCheckboxStates[combinedKey] = checkedLevels
          }
        })
      })
      setCheckboxStates(initialCheckboxStates)
      
      // Fetch graph data for visualization
      if (refAdeme) {
        await fetchGraphData(refAdeme)
      }
      
    } catch (error) {
      message.error('Failed to load simulation configuration')
    } finally {
      setLoading(false)
    }
  }

  // Extract ref_ademe from URL path
  const extractRefAdemeFromUrl = () => {
    const pathSegments = window.location.pathname.split('/')
    const lastSegment = pathSegments[pathSegments.length - 1]
    
    // Check if the last segment looks like a ref_ademe (13 characters, alphanumeric)
    if (lastSegment && lastSegment.length === 13 && /^[A-Z0-9]+$/.test(lastSegment)) {
      return lastSegment
    }
    
    return null
  }

  // Extract ref_ademe from URL when component mounts
  React.useEffect(() => {
    const extractedRefAdeme = extractRefAdemeFromUrl()
    
    if (extractedRefAdeme) {
      setRefAdeme(extractedRefAdeme)
    }
  }, [])

  // Handle authentication callback
  const handleAuthCallback = async (code: string) => {
    // Prevent duplicate calls
    if (isProcessingAuth || isAuthenticated || hasProcessedCode.current) {
      return
    }
    
    // Mark this code as processed to prevent duplicates
    hasProcessedCode.current = true
    setIsProcessingAuth(true)
    
    try {
      // Exchange authorization code for tokens using Cognito
      const cognitoDomain = 'checkdpe-dev-auth.auth.eu-west-3.amazoncognito.com'
      const clientId = '1k9lvvlnhs320okctrklckeh50'
      const redirectUri = window.location.origin
      
      // For Cognito, we need to use the exact same redirect_uri that was used in the authorization request
      const tokenResponse = await fetch(`https://${cognitoDomain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code: code,
          redirect_uri: redirectUri,
          // Add PKCE parameters if your app client uses PKCE
          // code_verifier: 'your-code-verifier', // Only if using PKCE
        }),
      })
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text()
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorData}`)
      }
      
      const tokens = await tokenResponse.json()
      
      // Store the access token
      setAccessToken(tokens.access_token)
      
      // Get user info from Cognito
      const userInfoResponse = await fetch(`https://${cognitoDomain}/oauth2/userInfo`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })
      
      let userInfoData = { email: 'user@example.com', name: 'Authenticated User' }
      if (userInfoResponse.ok) {
        userInfoData = await userInfoResponse.json()
        setUserInfo({
          email: userInfoData.email,
          name: userInfoData.name || userInfoData.email
        })
      }
      
      // Save authentication state to localStorage
      saveAuthState(tokens.access_token, {
        email: userInfoData.email,
        name: userInfoData.name || userInfoData.email
      })
      
      setIsAuthenticated(true)
      
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
      
      message.success('Successfully logged in!')
      
    } catch (error) {
      message.error('Authentication failed')
    } finally {
      setIsProcessingAuth(false)
    }
  }

  // Check for authentication callback on component mount - only run once
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code && !hasProcessedCode.current) {
      handleAuthCallback(code)
    }
  }, []) // Empty dependency array - only run once on mount

  // Initialize form when access token, authentication, and ref_ademe are available
  React.useEffect(() => {
    if (accessToken && isAuthenticated && refAdeme) {
      initializeForm()
    }
  }, [accessToken, isAuthenticated, refAdeme])

  // Fetch simulations list when no ref_ademe is present
  React.useEffect(() => {
    if (!refAdeme) {
      fetchSimulationsList()
    }
  }, [refAdeme, fetchSimulationsList])

  // Also fetch simulations list on mount if no ref_ademe
  React.useEffect(() => {
    if (!refAdeme) {
      fetchSimulationsList()
    }
  }, []) // Empty dependency array - only run once on mount

  const totalCombinations = useMemo(() => {
    let total = 1
    
    entries.forEach(entry => {
      // Check if ANY simulation is active for this entry
      const hasActiveSimulation = entry.simul.some(simul => simul.active)
      
      if (hasActiveSimulation) {
        // Calculate combinations for this entry by multiplying all active simulations
        let entryCombinations = 1  // Start with 1 for multiplication
        entry.simul.forEach(simul => {
          if (simul.active) {
            const combinedKey = `${entry.id}_${simul.id}`
            const simulationCheckboxState = checkboxStates[combinedKey] || [0]
            const checkedChoices = simulationCheckboxState.length
            entryCombinations *= checkedChoices  // Multiply instead of add
          }
        })
        
        total *= entryCombinations
      }
    })
    
    return total
  }, [entries, checkboxStates])

  const summary = useMemo(() => (
    <Space wrap>
      {entries.map((entry, index) => (
        <Tag key={entry.id} color={['blue', 'geekblue', 'purple', 'cyan', 'magenta'][index % 5]}>
          {entry.label}: {values[entry.id] || 0}
        </Tag>
      ))}
    </Space>
  ), [entries, values])

  const onFinish = (v: LevelsForm) => setValues(v)
  const onReset = () => {
    const initial: LevelsForm = {}
    entries.forEach(entry => initial[entry.id] = 0)
    form.setFieldsValue(initial)
    setValues(initial)
    
    // Reset all entries to enabled state
    setEntries(prev => prev.map(entry => ({ 
      ...entry, 
      simul: entry.simul.map((simul, index) => 
        index === 0 ? { ...simul, active: true } : simul
      )
    })))
    
    // Trigger reset in all LevelCheckboxes components
    setResetTrigger(prev => prev + 1)
    
    // Reset checkbox states to initial API values
    const initialCheckboxStates: Record<string, Level[]> = {}
    entries.forEach(entry => {
      // Reset each simulation separately
      entry.simul.forEach(simul => {
        if (simul.active && simul.choices) {
          const combinedKey = `${entry.id}_${simul.id}`
          const checkedLevels: Level[] = [0] // Always start with Level 0
          
          simul.choices.forEach((choice, index) => {
            if (choice.checked) {
              checkedLevels.push(index + 1 as Level)
            }
          })
          
          initialCheckboxStates[combinedKey] = checkedLevels
        }
      })
    })
    setCheckboxStates(initialCheckboxStates)
    
    message.success('Form reset successfully')
  }

  const toggleEntry = (entryId: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId ? { 
        ...entry, 
        simul: entry.simul.map((simul, index) => 
          index === 0 ? { ...simul, active: !simul.active } : simul
        )
      } : entry
    ))
  }

  const toggleSimulation = (entryId: string, simulationId: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        const currentSimul = entry.simul.find(simul => simul.id === simulationId)
        if (!currentSimul) return entry
        
        const newActiveState = !currentSimul.active
        
        // If we're activating a simulation, deactivate all others for this element
        if (newActiveState) {
          return {
            ...entry,
            simul: entry.simul.map(simul => ({
              ...simul,
              active: simul.id === simulationId // Only the clicked one is active
            }))
          }
        } else {
          // If we're deactivating, just toggle the current one
          return {
            ...entry,
            simul: entry.simul.map(simul => 
              simul.id === simulationId 
                ? { ...simul, active: newActiveState }
                : simul
            )
          }
        }
      }
      return entry
    }))
  }

  const removeSimulation = (entryId: string, simulationId: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId ? { 
        ...entry, 
        simul: entry.simul.filter(simul => simul.id !== simulationId)
      } : entry
    ))
  }

  const confirmDeleteSimulation = (entryId: string, simulationId: string, simulationName: string) => {
    setSimulationToDelete({ entryId, simulationId, simulationName })
    setIsDeleteSimulationModalVisible(true)
  }

  const handleDeleteSimulationConfirmed = () => {
    if (simulationToDelete) {
      removeSimulation(simulationToDelete.entryId, simulationToDelete.simulationId)
      message.success('Simulation deleted successfully')
      setIsDeleteSimulationModalVisible(false)
      setSimulationToDelete(null)
    }
  }

  const attachScope = async (entryId: string, simulationId: string) => {
    try {
      if (!accessToken || !refAdeme) {
        message.error('No access token or ref_ademe available')
        return
      }

      // Set loading state for this specific simulation
      setAttachingScope(prev => ({ ...prev, [`${entryId}-${simulationId}`]: true }))

      // Call the simul_scope_init endpoint
      const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_scope_init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref_ademe: refAdeme,
          group_id: simulationId,
          element: entryId
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      
      // Refresh the simul_init data to get the new scope
      await initializeForm()
      
      message.success('Scope attached successfully')
      
    } catch (error) {
      message.error('Failed to attach scope')
    } finally {
      // Clear loading state
      setAttachingScope(prev => ({ ...prev, [`${entryId}-${simulationId}`]: false }))
    }
  }

  const toggleEntryEditMode = (entryId: string) => {
    setEditMode(prev => {
      const newEditMode = {
        ...prev,
        [entryId]: !prev[entryId]
      }
      
      // If we're exiting edit mode, clear any ongoing label/description editing for this entry
      if (!newEditMode[entryId]) {
        // Clear any ongoing label editing for this entry
        setEditingSimulLabels(prev => {
          const newState = { ...prev }
          Object.keys(newState).forEach(key => {
            if (key.startsWith(`${entryId}-`)) {
              delete newState[key]
            }
          })
          return newState
        })
        
        // Clear any ongoing description editing for this entry
        setEditingSimulDescriptions(prev => {
          const newState = { ...prev }
          Object.keys(newState).forEach(key => {
            if (key.startsWith(`${entryId}-`)) {
              delete newState[key]
            }
          })
          return newState
        })
      }
      
      return newEditMode
    })
  }



  const toggleSimulLabelEdit = (entryId: string, simulId: string) => {
    const currentEntry = entries.find(e => e.id === entryId)
    const currentSimul = currentEntry?.simul.find(s => s.id === simulId)
    if (currentSimul) {
      setEditingSimulLabels(prev => ({
        ...prev,
        [`${entryId}-${simulId}`]: currentSimul.label
      }))
    }
  }

  const saveSimulLabel = async (entryId: string, simulId: string) => {
    const newLabel = editingSimulLabels[`${entryId}-${simulId}`]
    if (newLabel && newLabel.trim()) {
      try {
        if (!accessToken) {
          message.error('No access token available')
          return
        }

        // Call the simul_group_edit endpoint
        const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_group_edit', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            entry: entryId,
            group: simulId,
            label: newLabel.trim()
          })
        })

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        // Update the simulation label in the entries state
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? {
                ...entry,
                simul: entry.simul.map(simul => 
                  simul.id === simulId 
                    ? { ...simul, label: newLabel.trim() }
                    : simul
                )
              }
            : entry
        ))
        
        // Clear the editing label
        setEditingSimulLabels(prev => {
          const newState = { ...prev }
          delete newState[`${entryId}-${simulId}`]
          return newState
        })
        
        message.success('Simulation label updated successfully')
      } catch (error) {
        message.error('Failed to save simulation label')
      }
    } else {
      message.error('Label cannot be empty')
    }
  }

  const cancelSimulLabelEdit = (entryId: string, simulId: string) => {
    // Clear the editing label
    setEditingSimulLabels(prev => {
      const newState = { ...prev }
      delete newState[`${entryId}-${simulId}`]
      return newState
    })
  }

  const toggleSimulDescriptionEdit = (entryId: string, simulId: string) => {
    const currentEntry = entries.find(e => e.id === entryId)
    const currentSimul = currentEntry?.simul.find(s => s.id === simulId)
    if (currentSimul) {
      setEditingSimulDescriptions(prev => ({
        ...prev,
        [`${entryId}-${simulId}`]: currentSimul.description || ''
      }))
    }
  }

  const saveSimulDescription = async (entryId: string, simulId: string) => {
    const newDescription = editingSimulDescriptions[`${entryId}-${simulId}`]
    if (newDescription !== undefined) {
      try {
        if (!accessToken) {
          message.error('No access token available')
          return
        }

        // Call the simul_group_edit endpoint
        const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_group_edit', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            entry: entryId,
            group: simulId,
            description: newDescription.trim() || null
          })
        })

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        // Update the simulation description in the entries state
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? {
                ...entry,
                simul: entry.simul.map(simul => 
                  simul.id === simulId 
                    ? { ...simul, description: newDescription.trim() || null }
                    : simul
              )
            }
          : entry
        ))
        
        // Clear the editing description
        setEditingSimulDescriptions(prev => {
          const newState = { ...prev }
          delete newState[`${entryId}-${simulId}`]
          return newState
        })
        
        message.success('Simulation description updated successfully')
      } catch (error) {
        message.error('Failed to save simulation description')
      }
    } else {
      message.error('Description cannot be empty')
    }
  }

  const cancelSimulDescriptionEdit = (entryId: string, simulId: string) => {
    // Clear the editing description
    setEditingSimulDescriptions(prev => {
      const newState = { ...prev }
      delete newState[`${entryId}-${simulId}`]
      return newState
    })
  }

  const openAddScenarioModal = async (entryId: string) => {
    try {
      if (!accessToken) {
        message.error('No access token available')
        return
      }

      // Set loading state for this specific entry
      setAddingScenario(prev => ({ ...prev, [entryId]: true }))

      // Call the simul_group_init endpoint
      const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_group_init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entry: entryId
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      
      // Refresh the simul_init data
      await initializeForm()
      
      message.success('Scenario added successfully')
      
    } catch (error) {
      message.error('Failed to add scenario')
    } finally {
      // Clear loading state
      setAddingScenario(prev => ({ ...prev, [entryId]: false }))
    }
  }

  // Function to clean JSON data by removing parent element path references
  const cleanJsonFromParentPath = (obj: any, parentElementPath: string): any => {
    if (!obj || typeof obj !== 'object') return obj
    
    if (Array.isArray(obj)) {
      return obj.map(item => cleanJsonFromParentPath(item, parentElementPath))
    }
    
    const cleanedObj: any = {}
    for (const [key, value] of Object.entries(obj)) {
      let cleanedKey = key
      
      // If key starts with the parent element path followed by a dot, remove that prefix
      if (typeof key === 'string' && key.startsWith(parentElementPath + '.')) {
        cleanedKey = key.substring(parentElementPath.length + 1)
      }
      
      // Recursively clean nested objects
      cleanedObj[cleanedKey] = cleanJsonFromParentPath(value, parentElementPath)
    }
    
    return cleanedObj
  }

  const openStepInfoModal = async (entryId: string, simulationId: string, stepIndex: number) => {
    try {
      if (!selectedSimulationData || !selectedSimulationData.data) {
        message.error('No simulation data available')
        return
      }

      setStepInfoLoading(true)
      setIsStepInfoModalVisible(true)

      // Calculate which card this simulation belongs to among ENABLED cards only
      const enabledCards: {entryId: string, simulId: string, entryIdx: number, simulIdx: number, label: string}[] = []
      entries.forEach((e, entryIdx) => {
        e.simul.filter(s => s.active).forEach((s, simulIdx) => {
          enabledCards.push({entryId: e.id, simulId: s.id, entryIdx, simulIdx, label: s.label || 'no-label'})
        })
      })
      const cardIndex = enabledCards.findIndex(s => s.entryId === entryId && s.simulId === simulationId)
      
      const simulationData = selectedSimulationData.data
      
      if (!simulationData.inputs) {
        message.error('No inputs data available for this simulation')
        setStepInfoData(null)
        return
      }

      // Use inputs from simul_simul based on the card index
      // cardIndex corresponds to the absolute position of the card and maps to inputs[cardIndex]
      let choiceInputs = Array.isArray(simulationData.inputs) 
        ? simulationData.inputs[cardIndex] || {}
        : simulationData.inputs
      
      // Get the parent element to find its path
      const parentEntry = entries.find(e => e.id === entryId)
      const parentElementPath = parentEntry?.path || `/config/${entryId}`
      
      // Clean the JSON data by removing parent element path references
      choiceInputs = cleanJsonFromParentPath(choiceInputs, parentElementPath)
      
      const result = {
        choice_index: stepIndex,
        card_index: cardIndex,
        inputs: choiceInputs,
        all_inputs_array: simulationData.inputs,
        simulation_id: simulationId,
        entry_id: entryId,
        choices_array: simulationData.choices || []
      }
      
      setStepInfoData(result)
      
    } catch (error) {
      message.error('Failed to extract step info')
      setStepInfoData(null)
    } finally {
      setStepInfoLoading(false)
    }
  }

  const openSettingEditModal = async (entryId: string, simulationId: string) => {
    try {
      if (!accessToken) {
        message.error('No access token available')
        return
      }

      setSelectedSetting({ entryId, simulationId })
      
      // Get current simulation data from local state first
      const currentEntry = entries.find(e => e.id === entryId)
      const currentSimul = currentEntry?.simul.find(s => s.id === simulationId)
      
      // Pre-populate with current local data immediately
      setSettingLabel(currentSimul?.label || '')
      setSettingPath(currentSimul?.path || '')
      setSettingJsonText('{}')
      setSettingJsonData({})
      
      // Show modal immediately with local data
      setIsSettingEditModalVisible(true)
      
      // Try to fetch additional data from API (optional)
      try {
        const response = await fetch(`https://api-dev.etiquettedpe.fr/backoffice/simul_setting_edit?entry=${entryId}&simulation=${simulationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const settingData = await response.json()
          
          // Update form with API data if available
          if (settingData.label) setSettingLabel(settingData.label)
          if (settingData.path) setSettingPath(settingData.path)
          if (settingData.json_action) {
            setSettingJsonText(JSON.stringify(settingData.json_action, null, 2))
            setSettingJsonData(settingData.json_action)
          }
        }
      } catch (apiError) {
        // Continue with local data
      }
      
    } catch (error) {
      message.error('Failed to open simulation settings modal')
    }
  }

  const openElementPathModal = (entryId: string) => {
    // Get the current element from local state
    const currentEntry = entries.find(entry => entry.id === entryId)
    
    if (currentEntry) {
      setSelectedElement(entryId)
      // Use the path from the local entry data (from API response)
      setElementPath(currentEntry.path || '')
      setIsElementPathModalVisible(true)
    } else {
      message.error('Entry not found')
    }
  }

  const saveSettingChanges = async () => {
    try {
      if (!accessToken || !selectedSetting) {
        message.error('No access token or setting selected')
        return
      }

      if (!settingLabel.trim()) {
        message.error('Label is required')
        return
      }

      // PATCH the updated settings to the API
      const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_setting_edit', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entry: selectedSetting.entryId,
          simulation: selectedSetting.simulationId,
          label: settingLabel.trim(),
          path: settingPath.trim(),
          json_action: settingJsonData
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      // Update the local state with the new values
      setEntries(prev => prev.map(entry => 
        entry.id === selectedSetting.entryId ? { 
          ...entry, 
          simul: entry.simul.map(simul => 
            simul.id === selectedSetting.simulationId 
              ? { ...simul, label: settingLabel.trim(), path: settingPath.trim() }
              : simul
          )
        } : entry
      ))

      message.success('Setting updated successfully')
      setIsSettingEditModalVisible(false)
      setSelectedSetting(null)
      setSettingLabel('')
      setSettingPath('')
      setSettingJsonText('')
      setSettingJsonData(null)
      
    } catch (error) {
      message.error('Failed to save setting')
    }
  }

  const saveElementPathChanges = async () => {
    try {
      if (!accessToken || !selectedElement) {
        message.error('No access token or element selected')
        return
      }

      // PATCH the updated element path to the API
      const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_setting_edit', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entry: selectedElement,
          path: elementPath.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      // Update the local state with the new path
      setEntries(prev => prev.map(entry => 
        entry.id === selectedElement ? { 
          ...entry, 
          path: elementPath.trim()
        } : entry
      ))

      message.success('Element path updated successfully')
      setIsElementPathModalVisible(false)
      setSelectedElement(null)
      setElementPath('')
      
    } catch (error) {
      message.error('Failed to save element path')
    }
  }

  const toggleScopeItem = (entryId: string, simulationId: string, scopeId: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          simul: entry.simul.map(simul => {
            if (simul.id === simulationId && simul.scope) {
              return {
                ...simul,
                scope: simul.scope.map(scopeItem => 
                  scopeItem.id === scopeId 
                    ? { ...scopeItem, selected: !scopeItem.selected }
                    : scopeItem
                )
              }
            }
            return simul
          })
        }
      }
      return entry
    }))
  }

  const toggleAllScopeItems = (entryId: string, simulationId: string, selectAll: boolean) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          simul: entry.simul.map(simul => {
            if (simul.id === simulationId && simul.scope) {
              return {
                ...simul,
                scope: simul.scope.map(scopeItem => ({
                  ...scopeItem,
                  selected: selectAll
                }))
              }
            }
            return simul
          })
        }
      }
      return entry
    }))
  }

  const updateChoiceLabel = (entryId: string, simulationId: string, choiceIndex: number, newLabel: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          simul: entry.simul.map(simul => {
            if (simul.id === simulationId && simul.choices && simul.choices[choiceIndex]) {
              return {
                ...simul,
                choices: simul.choices.map((choice, index) => 
                  index === choiceIndex 
                    ? { ...choice, label: newLabel }
                    : choice
                )
              }
            }
            return simul
          })
        }
      }
      return entry
    }))
  }

  const submitFormData = async () => {
    try {
      if (!accessToken) {
        message.error('No access token available')
        return
      }

      // Prepare the structured data to send
      const formData = {
        ref_ademe: refAdeme,
        entries: entries.map(entry => {
          return {
            id: entry.id,
            label: entry.label,
            category: entry.category,
            simul: entry.simul.map((simul, simulIndex) => {
              return {
                id: simul.id,
                active: simul.active,
                label: simul.label,
                description: simul.description,
                path: simul.path,
                scope: simul.scope?.map(scopeItem => {
                  return {
                    id: scopeItem.id,
                    label: scopeItem.label,
                    description: scopeItem.description,
                    selected: scopeItem.selected
                  }
                }) || [],
                choices: simul.choices.map((choice, index) => ({
                  id: choice.id,
                  label: choice.label,
                  description: choice.description,
                  checked: checkboxStates[`${entry.id}_${simul.id}`]?.includes((index + 1) as Level) || false
                }))
              }
            })
          }
        }),
        totalCombinations,
        formValues: values,
        checkboxStates,
        timestamp: new Date().toISOString()
      }

      const response = await fetch('https://api-dev.etiquettedpe.fr/backoffice/simul_init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Simulation application failed: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      message.success('Simulation applied successfully!')
      
      // Refresh graph data after successful submission
      try {
        if (refAdeme) {
          await fetchGraphData(refAdeme)
          
          // Auto-switch to results tab
          setActiveTab('results')
        } else {
          message.warning('Simulation applied but no project reference available for results.')
        }
        
      } catch (graphError) {
        message.warning('Simulation applied but failed to refresh results. Please check the Results tab manually.')
      }
      
    } catch (error) {
      message.error('Failed to apply simulation')
    }
  }

  const addEntry = () => {
    if (!newEntryName.trim()) {
      message.error('Please enter a name for the entry')
      return
    }
    
    const newEntry: Entry = {
      id: `entry${Date.now()}`,
      label: newEntryName.trim(),
      category: 'Custom',
      path: `/config/${newEntryName.trim().toLowerCase().replace(/\s+/g, '_')}`,
      simul: [{
        id: `simul_${newEntryName.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        active: true,
        label: `Simulation ${newEntryName.trim()}`,
        description: `Configuration personnalisée pour ${newEntryName.trim()}`,
        path: `/config/${newEntryName.trim().toLowerCase().replace(/\s+/g, '_')}/custom`,
        choices: []
      }]
    }
    
    setEntries(prev => [...prev, newEntry])
    setNewEntryName('')
    setIsAddModalVisible(false)
    message.success('Entry added successfully')
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { colorPrimary: '#1677ff', borderRadius: 8 }
      }}
    >
      <AntdApp>
        <Layout style={{ minHeight: '100vh' }}>
          <Layout.Header style={{ background: 'white', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Title 
              level={3} 
              style={{ 
                margin: 0, 
                cursor: 'pointer',
                color: '#1677ff',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0958d9'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#1677ff'}
              onClick={() => {
                // Navigate to root URL without parameters
                window.location.href = window.location.origin
              }}
            >
              DEV scandpe
            </Typography.Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {isAuthenticated ? (
                <>
                  <Typography.Text type="secondary">
                    Welcome, {userInfo?.name || 'User'}
                  </Typography.Text>
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => setIsSettingsModalVisible(true)}
                    style={{ marginRight: '8px' }}
                  >
                    Settings
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsAuthenticated(false)
                      setUserInfo(null)
                      setAccessToken(null)
                      clearAuthState()
                      message.success('Logged out successfully')
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  type="primary" 
                  onClick={() => {
                    // Redirect to AWS Cognito Hosted UI
                    const cognitoDomain = 'checkdpe-dev-auth.auth.eu-west-3.amazoncognito.com'
                    const clientId = '1k9lvvlnhs320okctrklckeh50'
                    const redirectUri = encodeURIComponent(window.location.origin)
                    const responseType = 'code'
                    const scope = 'openid email profile'
                    
                    const loginUrl = `https://${cognitoDomain}/login?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUri}`
                    
                    window.location.href = loginUrl
                  }}
                >
                  Login
                </Button>
              )}
            </div>
          </Layout.Header>
          <Layout.Content style={{ padding: 24 }}>
            {!isAuthenticated ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <Typography.Title level={2}>Welcome to DEV scandpe</Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: '16px' }}>
                  Please log in to access the simulation configuration
                </Typography.Text>
              </div>
            ) : !refAdeme ? (
              // Landing page - show simulations list when no ref_ademe
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <Typography.Title level={2}>Select a Simulation</Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: '16px', marginBottom: '32px', display: 'block' }}>
                  Choose a simulation from the list below to configure
                </Typography.Text>
                
                {/* Header with New Project Button and Edit Mode Toggle */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '32px',
                  maxWidth: '600px',
                  margin: '0 auto 32px auto'
                }}>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => setIsNewProjectModalVisible(true)}
                    style={{ 
                      borderRadius: '8px',
                      padding: '8px 24px',
                      height: 'auto',
                      fontSize: '16px'
                    }}
                  >
                    + New Project
                  </Button>
                  
                  {/* Edit Mode Toggle */}
                  <Button
                    type={homeEditMode ? 'primary' : 'default'}
                    icon={<EditOutlined />}
                    onClick={() => setHomeEditMode(!homeEditMode)}
                    style={{
                      borderRadius: '8px',
                      padding: '8px 16px',
                      height: 'auto'
                    }}
                  >
                    {homeEditMode ? 'Exit Edit' : 'Edit'}
                  </Button>
                </div>
                
                                  {/* View mode selector */}
                <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>

                  <div style={{ marginTop: '4px' }}>
                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
                      View: {' '}
                      <span 
                        style={{ 
                          cursor: 'pointer', 
                          color: homeViewMode === 'cards' ? '#1677ff' : '#666',
                          textDecoration: homeViewMode === 'cards' ? 'underline' : 'none'
                        }}
                        onClick={() => setHomeViewMode('cards')}
                      >
                        cards
                      </span>
                      {' | '}
                      <span 
                        style={{ 
                          cursor: 'pointer', 
                          color: homeViewMode === 'table' ? '#1677ff' : '#666',
                          textDecoration: homeViewMode === 'table' ? 'underline' : 'none'
                        }}
                        onClick={() => setHomeViewMode('table')}
                      >
                        table
                      </span>
                    </Typography.Text>
                  </div>
                </div>
                
                {/* Cards View */}
                {homeViewMode === 'cards' && (
                  <Row gutter={[16, 16]} justify="center">
                    {Array.isArray(simulationsList) && simulationsList.map((simulation) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={simulation.id}>
                        <Card
                          hoverable={!homeEditMode}
                          onClick={homeEditMode ? undefined : () => navigateToSimulation(simulation.ref_ademe)}
                          style={{ 
                            cursor: homeEditMode ? 'default' : 'pointer',
                            textAlign: 'center',
                            border: '2px solid transparent',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                          }}
                          bodyStyle={{ padding: '24px 16px' }}
                        >
                          {/* Delete button when in edit mode */}
                          {homeEditMode && (
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              danger
                              size="small"
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                zIndex: 10,
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid #ff4d4f'
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(simulation.ref_ademe)
                              }}
                            />
                          )}
                          
                          <div style={{ marginBottom: '16px' }}>
                            <Typography.Title level={3} style={{ margin: 0, color: '#1677ff' }}>
                              {simulation.ref_ademe}
                            </Typography.Title>
                          </div>
                          
                          <Tag 
                            color={
                              simulation.status === 'running' ? 'processing' :
                              simulation.status === 'completed' ? 'success' :
                              simulation.status === 'failed' ? 'error' : 'default'
                            }
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            {simulation.status.toUpperCase()}
                          </Tag>
                          
                          <div style={{ marginTop: '12px' }}>
                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                              ID: {simulation.id}
                            </Typography.Text>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
                
                {/* Table View */}
                {homeViewMode === 'table' && (
                  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Table
                      dataSource={simulationsList}
                      columns={[
                        {
                          title: 'ID',
                          dataIndex: 'id',
                          key: 'id',
                          sorter: (a, b) => a.id - b.id,
                          width: 80,
                          render: (id) => (
                            <Typography.Text code>{id}</Typography.Text>
                          )
                        },
                        {
                          title: 'Reference ADEME',
                          dataIndex: 'ref_ademe',
                          key: 'ref_ademe',
                          sorter: (a, b) => a.ref_ademe.localeCompare(b.ref_ademe),
                          render: (ref_ademe, record) => (
                            <Button
                              type="link"
                              style={{ padding: 0, height: 'auto', fontSize: '14px' }}
                              onClick={() => navigateToSimulation(ref_ademe)}
                              disabled={homeEditMode}
                            >
                              {ref_ademe}
                            </Button>
                          )
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          sorter: (a, b) => a.status.localeCompare(b.status),
                          width: 120,
                          render: (status) => (
                            <Tag 
                              color={
                                status === 'running' ? 'processing' :
                                status === 'completed' ? 'success' :
                                status === 'failed' ? 'error' : 'default'
                              }
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              {status.toUpperCase()}
                            </Tag>
                          )
                        },
                        {
                          title: 'Actions',
                          key: 'actions',
                          width: 120,
                          render: (_, record) => (
                            <Space size="small">
                              {homeEditMode ? (
                                <Button
                                  type="text"
                                  icon={<DeleteOutlined />}
                                  danger
                                  size="small"
                                  onClick={() => handleDeleteProject(record.ref_ademe)}
                                >
                                  Delete
                                </Button>
                              ) : (
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() => navigateToSimulation(record.ref_ademe)}
                                >
                                  Open
                                </Button>
                              )}
                            </Space>
                          )
                        }
                      ]}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`
                      }}
                      size="middle"
                      bordered
                      style={{ backgroundColor: 'white' }}
                    />
                  </div>
                )}
                
                {simulationsList.length === 0 && (
                  <div style={{ marginTop: '32px' }}>
                    <Typography.Text type="secondary">
                      No simulations available. Please check the API connection.
                    </Typography.Text>
                  </div>
                )}
              </div>
            ) : (
              <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                  // If switching to form tab, remove simul_id from URL
                  if (key === 'form') {
                    const currentUrl = new URL(window.location.href)
                    currentUrl.searchParams.delete('simul_id')
                    window.history.replaceState({}, '', currentUrl.toString())
                  }
                  setActiveTab(key)
                }}
                items={[
                  {
                    key: 'form',
                    label: 'Simulation Configuration',
                    children: (
                      <div style={{ position: 'relative' }}>
                        {/* Floating House in left margin */}
                        <div style={{ 
                          position: 'fixed',
                          left: '0px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '160px',
                          zIndex: 1000
                        }}>
                          <InteractiveHouse hoveredElement={hoveredElement} />
                        </div>
                        

                        
                        {/* Form content with columns layout */}
                        <Row gutter={24}>
                          {/* Left column for floating info panel (hidden on mobile) */}
                          <Col xs={0} sm={0} md={6} lg={6} xl={6} xxl={6}>
                            <div style={{ position: 'sticky', top: '24px' }}>
                              {/* Reserved for future content */}
                            </div>
                          </Col>
                          
                          {/* Center column for the form */}
                          <Col xs={24} sm={24} md={14} lg={14} xl={14} xxl={14}>
                                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Scenarios</span>
                        <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                          Total combinations: <strong>{totalCombinations}</strong>
                        </Typography.Text>
                      </div>
                    } 
                    bordered
                  >
                    {loading ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Typography.Text>Loading simulation configuration...</Typography.Text>
                      </div>
                    ) : (
                      <Form form={form} layout="vertical" initialValues={values} onFinish={onFinish} onValuesChange={(_, all) => setValues(all as LevelsForm)}>
                    {Object.entries(
                      entries.reduce((acc, entry) => {
                        if (!acc[entry.category]) acc[entry.category] = [];
                        acc[entry.category].push(entry);
                        return acc;
                      }, {} as Record<string, Entry[]>)
                    ).map(([category, categoryEntries]) => (
                      <div key={category}>
                        <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 8, color: '#1677ff' }}>
                          {category}
                        </Typography.Title>
                        <Row gutter={[16, 8]}>
                          {categoryEntries.map((entry, cardIndex) => (
                            <Col xs={24} sm={12} lg={8} key={entry.id}>
                              <Card 
                                size="small" 
                                onMouseEnter={() => setHoveredElement(entry.id)}
                                onMouseLeave={() => setHoveredElement(null)}
                                title={
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                      <span 
                                        style={{ fontWeight: '500' }}
                                        title={`Path: ${entry.path}`}
                                      >
                                        {entry.label}
                                      </span>
                                      {!selectedSimulId && (
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<EditOutlined />}
                                                  onClick={() => {
          toggleEntryEditMode(entry.id)
        }}
                                          title={editMode[entry.id] ? "Exit edit mode" : "Enter edit mode"}
                                          style={{ 
                                            fontSize: '12px', 
                                            padding: '4px', 
                                            height: 'auto',
                                            color: editMode[entry.id] ? '#ff4d4f' : '#8c8c8c',
                                            minWidth: 'auto'
                                          }}
                                        />
                                      )}
                                    </div>
                                    
                                    {/* Simulation occurrences */}
                                    {entry.simul.map((simul, simulIndex) => (
                                      <div key={simul.id}>
                                        {simulIndex > 0 && (
                                          <Divider style={{ margin: '12px 0', borderColor: '#f0f0f0' }} />
                                        )}
                                        <div style={{ 
                                          padding: '8px 12px', 
                                          backgroundColor: simul.active ? '#f6ffed' : '#fafafa',
                                          border: `1px solid ${simul.active ? '#b7eb8f' : '#d9d9d9'}`,
                                          borderRadius: '6px',
                                          marginBottom: simulIndex < entry.simul.length - 1 ? '8px' : '0'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                              {editingSimulLabels[`${entry.id}-${simul.id}`] !== undefined ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                  <Input
                                                    value={editingSimulLabels[`${entry.id}-${simul.id}`]}
                                                    onChange={(e) => setEditingSimulLabels(prev => ({
                                                      ...prev,
                                                      [`${entry.id}-${simul.id}`]: e.target.value
                                                    }))}
                                                    style={{ fontSize: '12px', flex: 1 }}
                                                    placeholder="Enter label"
                                                    onPressEnter={() => saveSimulLabel(entry.id, simul.id)}
                                                  />
                                                  <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<CheckOutlined />}
                                                    onClick={() => saveSimulLabel(entry.id, simul.id)}
                                                    style={{ color: '#52c41a', padding: '2px 4px' }}
                                                    title="Save label"
                                                  />
                                                  <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<CloseOutlined />}
                                                    onClick={() => cancelSimulLabelEdit(entry.id, simul.id)}
                                                    style={{ color: '#ff4d4f', padding: '2px 4px' }}
                                                    title="Cancel edit"
                                                  />
                                                </div>
                                              ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                  <Button 
                                                    type="link" 
                                                    size="small" 
                                                    style={{ padding: 0, fontSize: '13px', fontWeight: '500', color: simul.active ? '#52c41a' : '#8c8c8c' }} 
                                                    onClick={() => openSettingEditModal(entry.id, simul.id)}
                                                    title="Edit simulation settings"
                                                  >
                                                    {simul.label.length > 25 ? `...${simul.label.slice(-25)}` : simul.label}
                                                  </Button>
                                                  {editMode[entry.id] && (
                                                    <Button
                                                      type="text"
                                                      size="small"
                                                      icon={<EditOutlined />}
                                                              onClick={() => {
          toggleSimulLabelEdit(entry.id, simul.id)
        }}
                                                      style={{ padding: '2px 4px', fontSize: '10px' }}
                                                      title="Edit label"
                                                    />
                                                  )}

                                                </div>
                                              )}
                                              {editingSimulDescriptions[`${entry.id}-${simul.id}`] !== undefined ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                  <Input
                                                    value={editingSimulDescriptions[`${entry.id}-${simul.id}`]}
                                                    onChange={(e) => setEditingSimulDescriptions(prev => ({
                                                      ...prev,
                                                      [`${entry.id}-${simul.id}`]: e.target.value
                                                    }))}
                                                    size="small"
                                                    style={{ fontSize: '11px', fontStyle: 'italic' }}
                                                    placeholder="Enter description..."
                                                  />
                                                  <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<CheckOutlined />}
                                                    onClick={() => saveSimulDescription(entry.id, simul.id)}
                                                    style={{ color: '#52c41a', padding: '2px 4px' }}
                                                    title="Save description"
                                                  />
                                                  <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<CloseOutlined />}
                                                    onClick={() => cancelSimulDescriptionEdit(entry.id, simul.id)}
                                                    style={{ color: '#ff4d4f', padding: '2px 4px' }}
                                                    title="Cancel edit"
                                                  />
                                                </div>
                                              ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                  {simul.description && (
                                                    <span style={{ 
                                                      fontSize: '11px', 
                                                      color: simul.active ? '#73d13d' : '#bfbfbf',
                                                      fontStyle: 'italic'
                                                    }}>
                                                      {simul.description}
                                                    </span>
                                                  )}
                                                  {editMode[entry.id] && (
                                                    <Button
                                                      type="text"
                                                      size="small"
                                                      icon={<EditOutlined />}
                                                              onClick={() => {
          toggleSimulDescriptionEdit(entry.id, simul.id)
        }}
                                                      style={{ padding: '2px 4px', fontSize: '10px' }}
                                                      title="Edit description"
                                                    />
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            {editMode[entry.id] ? (
                                              <Button
                                                type="text"
                                                size="small"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => confirmDeleteSimulation(entry.id, simul.id, simul.label)}
                                                style={{ padding: '2px 4px', minWidth: 'auto' }}
                                              />
                                            ) : (
                                              <Switch
                                                checked={simul.active}
                                                onChange={() => toggleSimulation(entry.id, simul.id)}
                                                disabled={Boolean(selectedSimulId)}
                                                size="small"
                                              />
                                            )}
                                          </div>
                                          
                                          {/* Scope discs - now inside each simulation card */}
                                          {simul.scope && simul.scope.length > 0 && (
                                            <div style={{ 
                                              display: 'flex', 
                                              flexDirection: 'column',
                                              gap: 4, 
                                              justifyContent: 'center', 
                                              alignItems: 'center',
                                              marginBottom: '8px',
                                              padding: '4px 0'
                                            }}>
                                              {/* Scope label and actions */}
                                              <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                marginBottom: '4px'
                                              }}>
                                                <Typography.Text 
                                                  style={{ 
                                                    fontSize: '11px', 
                                                    fontWeight: '500',
                                                    color: simul.active ? '#52c41a' : '#8c8c8c'
                                                  }}
                                                >
                                                  Scope:
                                                </Typography.Text>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                  <Button
                                                    type="link"
                                                    size="small"
                                                    style={{ 
                                                      padding: '0 4px', 
                                                      fontSize: '10px', 
                                                      height: 'auto',
                                                      color: simul.active ? '#1677ff' : '#8c8c8c'
                                                    }}
                                                    onClick={() => toggleAllScopeItems(entry.id, simul.id, true)}
                                                    title="Select all scope items"
                                                  >
                                                    all
                                                  </Button>
                                                  <Typography.Text 
                                                    style={{ 
                                                      fontSize: '10px', 
                                                      color: simul.active ? '#8c8c8c' : '#bfbfbf'
                                                    }}
                                                  >
                                                    |
                                                  </Typography.Text>
                                                  <Button
                                                    type="link"
                                                    size="small"
                                                    style={{ 
                                                      padding: '0 4px', 
                                                      fontSize: '10px', 
                                                      height: 'auto',
                                                      color: simul.active ? '#1677ff' : '#8c8c8c'
                                                    }}
                                                    onClick={() => toggleAllScopeItems(entry.id, simul.id, false)}
                                                    title="Deselect all scope items"
                                                  >
                                                    none
                                                  </Button>
                                                </div>
                                              </div>
                                              
                                              {/* Scope discs */}
                                              <div style={{ 
                                                display: 'flex', 
                                                gap: 4, 
                                                justifyContent: 'center', 
                                                flexWrap: 'wrap'
                                              }}>
                                                {simul.scope.map((scopeItem, index) => {
                                                  // Check if this scope item represents a cardinal direction (case-insensitive, check both label and description)
                                                  const checkText = `${scopeItem.label} ${scopeItem.description || ''}`.toLowerCase()
                                                  const isCardinalDirection = ['est', 'ouest', 'nord', 'sud'].some(direction => 
                                                    checkText.includes(direction)
                                                  )
                                                  
                                                  // Get the appropriate arrow for each direction
                                                  const getDirectionalArrow = (text: string) => {
                                                    const lowerText = text.toLowerCase()
                                                    // Check longer words first to avoid conflicts
                                                    if (lowerText.includes('ouest')) return '←'
                                                    if (lowerText.includes('nord')) return '↑'
                                                    if (lowerText.includes('sud')) return '↓'
                                                    if (lowerText.includes('est')) return '→'
                                                    return null
                                                  }
                                                  
                                                  const directionalArrow = getDirectionalArrow(checkText)
                                                  

                                                  
                                                  return (
                                                    <div
                                                      key={scopeItem.id}
                                                      style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                        cursor: 'pointer'
                                                      }}
                                                    >
                                                      <div
                                                        style={{
                                                          width: '20px',
                                                          height: '20px',
                                                          borderRadius: '50%',
                                                          backgroundColor: scopeItem.selected ? '#1677ff' : '#d9d9d9',
                                                          border: '1px solid #ccc',
                                                          opacity: scopeItem.selected ? 1 : 0.6,
                                                          transition: 'all 0.2s ease',
                                                          cursor: 'pointer',
                                                          position: 'relative'
                                                        }}
                                                        onClick={() => toggleScopeItem(entry.id, simul.id, scopeItem.id)}
                                                        title={scopeItem.description ? `${scopeItem.label}: ${scopeItem.description}` : scopeItem.label}
                                                        onMouseEnter={(e) => {
                                                          e.currentTarget.style.transform = 'scale(1.2)'
                                                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
                                                        }}
                                                        onMouseLeave={(e) => {
                                                          e.currentTarget.style.transform = 'scale(1)'
                                                          e.currentTarget.style.boxShadow = 'none'
                                                        }}
                                                      >
                                                        {/* Directional arrow overlay for cardinal directions */}
                                                        {directionalArrow && (
                                                          <div
                                                            style={{
                                                              position: 'absolute',
                                                              top: '50%',
                                                              left: '50%',
                                                              transform: 'translate(-50%, -50%)',
                                                              fontSize: '8px',
                                                              color: scopeItem.selected ? 'white' : '#1677ff',
                                                              fontWeight: 'bold',
                                                              lineHeight: 1,
                                                              pointerEvents: 'none',
                                                              opacity: 0.5
                                                            }}
                                                          >
                                                            {directionalArrow}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Attach Scope button when no scope exists */}
                                          {(!simul.scope || simul.scope.length === 0) && editMode[entry.id] && (
                                            <div style={{ 
                                              display: 'flex', 
                                              justifyContent: 'center', 
                                              marginTop: '8px',
                                              marginBottom: '8px'
                                            }}>
                                              <Button
                                                type="dashed"
                                                size="small"
                                                onClick={() => attachScope(entry.id, simul.id)}
                                                loading={attachingScope[`${entry.id}-${simul.id}`]}
                                                disabled={attachingScope[`${entry.id}-${simul.id}`]}
                                                style={{ 
                                                  fontSize: '11px',
                                                  padding: '2px 8px',
                                                  height: 'auto'
                                                }}
                                              >
                                                {attachingScope[`${entry.id}-${simul.id}`] ? 'Attaching...' : 'Attach scope'}
                                              </Button>
                                            </div>
                                          )}
                                          
                                          {/* Choices for this simulation */}
                                          {simul.active && simul.choices && simul.choices.length > 0 && (
                                            <div style={{ marginTop: '8px' }}>
                                              {(() => {
                                                // Calculate global position of this simulation among ALL enabled simulations
                                                const allEnabledSimulations: {entryId: string, simulId: string}[] = []
                                                entries.forEach(e => {
                                                  e.simul.filter(s => s.active).forEach(s => {
                                                    allEnabledSimulations.push({entryId: e.id, simulId: s.id})
                                                  })
                                                })
                                                const globalCardIndex = allEnabledSimulations.findIndex(s => s.entryId === entry.id && s.simulId === simul.id)
                                                

                                                return (
                                                  <LevelCheckboxes 
                                                    entry={entry} 
                                                    simulationId={simul.id}
                                                    cardIndex={globalCardIndex}
                                                    resetTrigger={resetTrigger} 
                                                    onCheckboxChange={handleCheckboxChange}
                                                    onLabelUpdate={updateChoiceLabel}
                                                    accessToken={accessToken}
                                                    refAdeme={refAdeme}
                                                    selectedChoices={selectedSimulationData?.data?.choices || null}
                                                    isReadOnly={Boolean(new URLSearchParams(window.location.search).get('simul_id'))}
                                                    openStepInfoModal={openStepInfoModal}
                                                  />
                                                )
                                              })()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                }
                              >
                                <div
                                style={{ 
                                  height: '100%',
                                  opacity: entry.simul.some(simul => simul.active) ? 1 : 0.5,
                                  backgroundColor: entry.simul.some(simul => simul.active) ? 'white' : '#f5f5f5'
                                }}
                                >
                                {/* Add Scenario button when in edit mode */}
                                {editMode[entry.id] && (
                                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                                    <Button 
                                      type="dashed" 
                                      onClick={() => openAddScenarioModal(entry.id)}
                                      icon={<PlusOutlined />}
                                      size="small"
                                      loading={addingScenario[entry.id]}
                                      disabled={addingScenario[entry.id]}
                                    >
                                      {addingScenario[entry.id] ? 'Adding...' : 'Add Scenario'}
                                    </Button>
                                  </div>
                                )}
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    ))}
                    <Divider />
                    <Space>
                      <Button 
                        type="primary" 
                        onClick={submitFormData}
                        loading={submitting}
                        disabled={totalCombinations > 10000 || Boolean(selectedSimulId)}
                        title={
                          totalCombinations > 10000
                            ? "max. combinations : 10,000"
                            : Boolean(selectedSimulId)
                              ? "Cannot apply simulation while viewing existing results"
                              : ""
                        }
                      >
                        {submitting ? 'Applying...' : 'Apply simulation'}
                      </Button>
                      <Button onClick={onReset}>Reset</Button>
                    </Space>
                  </Form>
                    )}
                  <Divider />
                  <Typography.Text strong>Current values:</Typography.Text>
                  <div style={{ marginTop: 8 }}>{summary}</div>
                </Card>
                          </Col>
                          
                          {/* Right column for selected simulation info (hidden on mobile) */}
                          <Col xs={0} sm={0} md={4} lg={4} xl={4} xxl={4}>
                            <div style={{ position: 'sticky', top: '24px' }}>
                              {/* Selected simulation data panel - shows clicked simulation, not hovered */}
                              {selectedSimulId && selectedSimulationData && (
                                <div
                                  style={{
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    fontSize: '12px',
                                    lineHeight: '1.4'
                                  }}
                                >
                                  <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                                    Selected: Simulation #{selectedSimulId}
                                  </div>
                                  {selectedSimulationData.data?.choices && (
                                    <div style={{ marginBottom: '4px' }}>
                                      <strong>Choices:</strong> [{selectedSimulationData.data.choices.join(', ')}]
                                    </div>
                                  )}
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>Inputs:</strong> {selectedSimulationData.data?.inputs ? Object.keys(selectedSimulationData.data.inputs).length : 0} fields
                                  </div>
                                  <div>
                                    <strong>Outputs:</strong> {selectedSimulationData.data?.outputs ? Object.keys(selectedSimulationData.data.outputs).length : 0} fields
                                  </div>
                                </div>
                              )}
                            </div>
                          </Col>
                        </Row>
                    </div>
                  )
                },
        {
          key: 'results',
          label: 'Results',
          children: (
            <Row gutter={24}>
              {/* Left column for floating info panel (hidden on mobile) */}
              <Col xs={0} sm={0} md={6} lg={6} xl={6} xxl={6}>
                <div style={{ position: 'sticky', top: '24px' }}>
                  {/* Reserved for future content */}
                </div>
              </Col>
              
              {/* Center column for the graph */}
              <Col xs={24} sm={24} md={14} lg={14} xl={14} xxl={14}>
                <Card title="Simulation Results" bordered>
                  <D3Scatterplot 
                    data={mockResults} 
                    graphData={graphData} 
                    selectedSimulId={selectedSimulId}
                  />
                  
                  {/* JSON Editors for Inputs/Outputs when simul_id is selected */}
                  {selectedSimulId && selectedSimulationData && (
                    <>
                      <Divider />
                      <Typography.Title level={4} style={{ marginBottom: '16px' }}>
                        Simulation Details
                      </Typography.Title>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <Typography.Text strong>Inputs:</Typography.Text>
                        <Input.TextArea
                          value={selectedSimulationData.data?.inputs ? JSON.stringify(selectedSimulationData.data.inputs, null, 2) : '{}'}
                          readOnly
                          rows={8}
                          style={{ 
                            width: '100%', 
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            backgroundColor: '#f5f5f5',
                            marginTop: '8px'
                          }}
                        />
                      </div>
                      
                      <div>
                        <Typography.Text strong>Outputs:</Typography.Text>
                        <Input.TextArea
                          value={selectedSimulationData.data?.outputs ? JSON.stringify(selectedSimulationData.data.outputs, null, 2) : '{}'}
                          readOnly
                          rows={8}
                          style={{ 
                            width: '100%', 
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            backgroundColor: '#f5f5f5',
                            marginTop: '8px'
                          }}
                        />
                      </div>
                    </>
                  )}
                  
                  <Divider />
                  <Typography.Text strong>Data Summary:</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {mockResults.map((result, index) => (
                        <Tag key={index} color={['blue', 'geekblue', 'purple'][index % 3]}>
                          Cost: €{result.estimated_cost} | kWh: {result.kwh}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </Card>
              </Col>
              
              {/* Right column for selected simulation info (hidden on mobile) */}
              <Col xs={0} sm={0} md={4} lg={4} xl={4} xxl={4}>
                <div style={{ position: 'sticky', top: '24px' }}>
                  {/* Selected simulation data panel - shows clicked simulation, not hovered */}
                  {selectedSimulId && selectedSimulationData && (
                    <div
                      style={{
                        backgroundColor: '#000',
                        color: '#fff',
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        fontSize: '12px',
                        lineHeight: '1.4'
                      }}
                    >
                      <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                        Selected: Simulation #{selectedSimulId}
                      </div>
                      {selectedSimulationData.data?.choices && (
                        <div style={{ marginBottom: '4px' }}>
                          <strong>Choices:</strong> [{selectedSimulationData.data.choices.join(', ')}]
                        </div>
                      )}
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Inputs:</strong> {selectedSimulationData.data?.inputs ? Object.keys(selectedSimulationData.data.inputs).length : 0} fields
                      </div>
                      <div>
                        <strong>Outputs:</strong> {selectedSimulationData.data?.outputs ? Object.keys(selectedSimulationData.data.outputs).length : 0} fields
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          )
        }
      ]}
    />
            )}


            
            {/* Floating button to navigate between form and results - only show when simul_id is present */}
            {selectedSimulId && (
              <div
                style={{
                  position: 'fixed',
                  bottom: '24px',
                  right: '24px',
                  zIndex: 1000,
                  width: '112px',
                  height: '112px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1677ff',
                  borderRadius: '50%',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  color: 'white'
                }}
                onClick={() => {
                  if (activeTab === 'results') {
                    // We're on results page, go back to form but keep simul_id
                    setActiveTab('form')
                  } else {
                    // We're on form page, go to results (keep simul_id if present)
                    setActiveTab('results')
                  }
                }}
                title={`${activeTab === 'results' ? "Go back to form" : "Go to graph"} (Simulation ${selectedSimulId})`}
              >
                {/* Close button (red cross) - top right */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#ff4d4f',
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    cursor: 'pointer',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 1001
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Remove simul_id from URL and clear context
                    const currentUrl = new URL(window.location.href)
                    currentUrl.searchParams.delete('simul_id')
                    window.history.replaceState({}, '', currentUrl.toString())
                    setSelectedSimulId(null)
                    setSelectedSimulationData(null)
                  }}
                  title="Close simulation context"
                >
                  ×
                </div>
                
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {activeTab === 'results' ? <ArrowLeftOutlined /> : <ArrowRightOutlined />}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center',
                  lineHeight: '1'
                }}>
                  #{selectedSimulId}
                </div>
              </div>
            )}
          </Layout.Content>
        </Layout>
        
        <Modal
          title="Add New Entry"
          open={isAddModalVisible}
          onOk={addEntry}
          onCancel={() => {
            setIsAddModalVisible(false)
            setNewEntryName('')
          }}
          okText="Add"
          cancelText="Cancel"
        >
          <Form layout="vertical">
            <Form.Item label="Entry Name" required>
              <Input
                placeholder="Enter entry name"
                value={newEntryName}
                onChange={(e) => setNewEntryName(e.target.value)}
                onPressEnter={addEntry}
                autoFocus
              />
            </Form.Item>
          </Form>
        </Modal>



        <Modal
          title="Edit Element Path"
          open={isElementPathModalVisible}
          onOk={saveElementPathChanges}
          onCancel={() => {
            setIsElementPathModalVisible(false)
            setSelectedElement(null)
            setElementPath('')
          }}
          okText="Save"
          cancelText="Cancel"
        >
          <Form layout="vertical">
            <Form.Item label="Path">
              <Input
                placeholder="Enter element path"
                value={elementPath}
                onChange={(e) => setElementPath(e.target.value)}
                autoFocus
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Create New Project"
          open={isNewProjectModalVisible}
          onOk={createNewProject}
          onCancel={() => {
            setIsNewProjectModalVisible(false)
            setNewProjectRefAdeme('')
          }}
          okText="Create"
          cancelText="Cancel"
        >
          <Form layout="vertical">
            <Form.Item 
              label="Project Reference" 
              required
              help="Enter a 13-character reference (uppercase letters and numbers only)"
            >
              <Input
                placeholder="e.g., 2508E0243162Z"
                value={newProjectRefAdeme}
                onChange={(e) => setNewProjectRefAdeme(e.target.value.toUpperCase())}
                onPressEnter={createNewProject}
                autoFocus
                maxLength={13}
                style={{ fontFamily: 'monospace', fontSize: '16px' }}
              />
            </Form.Item>
            <div style={{ marginTop: '16px' }}>
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                This will create a new project and redirect you to the configuration page.
              </Typography.Text>
            </div>
          </Form>
        </Modal>



        {/* Settings Modal */}
        <Modal
          title="Settings"
          open={isSettingsModalVisible}
          onCancel={() => setIsSettingsModalVisible(false)}
          footer={null}
          width={800}
        >
          {React.useMemo(() => (
            <SettingsPage 
              key="settings-page"
              onClose={() => setIsSettingsModalVisible(false)}
              accessToken={accessToken}
            />
          ), [accessToken])}
        </Modal>

        {/* Delete Simulation Confirmation Modal */}
        <Modal
          title="Delete Simulation"
          open={isDeleteSimulationModalVisible}
          onOk={handleDeleteSimulationConfirmed}
          onCancel={() => {
            setIsDeleteSimulationModalVisible(false)
            setSimulationToDelete(null)
          }}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <div style={{ padding: '16px 0' }}>
            <Typography.Text>
              Are you sure you want to delete the simulation <strong>"{simulationToDelete?.simulationName}"</strong>?
            </Typography.Text>
            <br />
            <Typography.Text type="warning" style={{ fontSize: '14px' }}>
              This action cannot be undone.
            </Typography.Text>
          </div>
        </Modal>

        {/* Step Info Modal */}
        <Modal
          title="Choice Inputs"
          open={isStepInfoModalVisible}
          onCancel={() => {
            setIsStepInfoModalVisible(false)
            setStepInfoData(null)
          }}
          footer={null}
          width={800}
        >
          {stepInfoLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Typography.Text>Loading choice inputs...</Typography.Text>
            </div>
          ) : stepInfoData ? (
            <div>
              <Typography.Title level={4} style={{ marginBottom: '16px' }}>
                Choice {stepInfoData.choice_index} Inputs
              </Typography.Title>
              <Typography.Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                Card #{stepInfoData.card_index + 1} - Choice {stepInfoData.choice_index} from simulation #{stepInfoData.simulation_id}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                Choices array: [{stepInfoData.choices_array.join(', ')}] - Showing inputs[{stepInfoData.card_index}] from inputs array
              </Typography.Text>
              <Typography.Title level={5} style={{ marginBottom: '8px' }}>
                Selected Input:
              </Typography.Title>
              <Input.TextArea
                value={JSON.stringify(stepInfoData.inputs, null, 2)}
                readOnly
                rows={10}
                style={{ 
                  width: '100%', 
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  marginBottom: '16px'
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Typography.Text type="secondary">No choice inputs available</Typography.Text>
            </div>
          )}
        </Modal>
      </AntdApp>
    </ConfigProvider>
  )
}


