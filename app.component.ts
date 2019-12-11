import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CachedDataService } from './services/CachedDataService';
import { DeviceReference } from './interfaces/DeviceReference';
import { DataService } from './services/DataService';

const CURRENT_SVG_IMAGE_KEY = '__nordex_current_svg_image';

interface IDeviceDescription {
  dtd: string;
  dtdFragment: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  deviceID = '4356367800';
  deviceTypeFilter = '';

  // dropdown menu data
  selectedDevice: DeviceReference;

  // alternatively, only store the selected device's index
  // selectedDeviceIndex = 1;

  deviceList: DeviceReference[] = [   // function to identify our devices
    /* {
      id: '4356367800',
      name: '01CWE0001',
    },
    {
      id: '4355144592',
      name: '33WEA00033',
    }, */
  ];

  debug = false;
  currentDevice: IDeviceDescription = {
    dtd: '',
    dtdFragment: ''
  };
  dataCache = {};           // Rest API Cumulocity
  variableReferences = [];
  intervalTimer = null;
  updateInterval = 1000;

  @ViewChild('dataContainer', { static: false }) dataContainer: ElementRef;   // dataContainer will connect templates to obtain information

  constructor(private dataService: CachedDataService, private directDataService: DataService) { }

  addUniqueVariableReference(name: string) {
    if (name !== '') {
      if (this.variableReferences.indexOf(name) === -1) {
        this.variableReferences.push(name);
      }
    }
  }

  //  Return values from our device list
  async updateDeviceList() {
    const results = await this.directDataService.getDeviceList(this.deviceTypeFilter);
    if (results.length > 0) {
      this.deviceList = results;
    }
  }

  handleVariableClick(event: any, name: string) {
    console.log('handle variable click', event.target.checked, name);
    this.dataCache[name] = {
      value: event.target.checked,
      unit: '',
      override: true,
    };
  }

  // Start the SVG updater timer which controls how often the DOM manipulations
  // are applied to the SVG image
  initSVGUpdateTimer() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
    this.intervalTimer = setInterval(() => {
      this.updateSVGComponents();
    }, this.updateInterval);
  }

  // Initialize defaults only when the view has loaded
  ngAfterViewInit() {
    const svgText = localStorage.getItem(CURRENT_SVG_IMAGE_KEY);
    this.dataContainer.nativeElement.innerHTML = svgText;
    // this.updateDeviceTypeDescription();
    this.initSVGUpdateTimer();

    this.updateDeviceList();

    // this.startSubscriptions();
  }

  async changeDeviceSubscriptions() {
    await this.updateDeviceTypeDescription();

    this.startSubscriptions();
  }

  // handle new file selection
  fileChanged(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onloadend = () => {
      if (reader.result) {
        this.dataContainer.nativeElement.innerHTML = reader.result;
        localStorage.setItem(CURRENT_SVG_IMAGE_KEY, `${reader.result}`);
      }
    };
  }

  // Update the device type description of the selected device id
  async updateDeviceTypeDescription() {
    try {
      const type = await this.dataService.getDeviceTypeDescriptionFromDevice(this.deviceID);
      this.currentDevice.dtd = type;
      this.currentDevice.dtdFragment = `nx_${type}`;
    } catch (err) {
      console.warn('Could not retrieve DTD from device', err);
    }
  }

  // Find an element by its Visio reference variable
  findElementByVisioReference(rootElement, name, subElementQuery?) {
    const el = rootElement.querySelector(`#${rootElement.id} [v\\:lbl=name][v\\:format=${name}]`);
    try {
      if (subElementQuery) {
        return this.findNestedElement(el.parentElement.parentElement, subElementQuery);
      }
      return el.parentElement.parentElement.children[2];
    } catch (err) {
      console.warn('Failed find element', err);
      return null;
    }
  }

  // Find a nested element when given a root element.
  // Note: This only works if the rootElement has an ID!
  findNestedElement(rootElement, query) {
    const el = rootElement.querySelector(`#${rootElement.id} ${query}`);
    try {
      return el;
    } catch (err) {
      console.debug('Failed find element', err);
      return null;
    }
  }

  // Start subscribing to measurements from the server. Update the data cache
  // each time a new measurement is received
  startSubscriptions() {
    const notification = this.dataService.subscribeToDevice(this.deviceID);
    notification.subscribe((evt) => {

      const series = evt.data[this.currentDevice.dtdFragment];
      const seriesNames = Object.keys(series);

      seriesNames.forEach((name) => {
        // Only update if
        let updateCache = true;
        if (this.dataCache[name] && this.dataCache[name].override) {
          updateCache = false;
        }
        if (updateCache) {
          this.dataCache[name] = series[name];
        }

        if (this.debug) {
          console.info(`new measurement: ${name}=${series[name].value}`);
        }
      });
    });
  }

  // Get a Viso Property value by name (within the SVG element scope)
  getVisioPropertyValue(rootElement: any, name: string): string {
    const el = rootElement.querySelector(`#${rootElement.id} [v\\:lbl=${name}]`);
    try {
      return el.getAttribute('v:format');
    } catch (err) {
      console.debug('Failed find element', err);
      return null;
    }
  }

  resetSimulatedValues() {
    this.variableReferences.forEach((name) => {
      if (this.dataCache[name]) {
        this.dataCache[name].override = false;
      }
    });
  }

  setInnerHTML(rootElement, label, subElementQuery, newValue) {
    const title = this.findElementByVisioReference(rootElement, label, subElementQuery);
    if (title) {
      title.innerHTML = newValue;
    }
  }

  // Update all SVG component with the dynamic functionality (i.e. open or close switches, update analog values etc.)
  // always update nxType value from Visio Software with each device name that you will use.
  updateSVGComponents() {

    const allSwitches = this.dataContainer.nativeElement.querySelectorAll('[v\\:lbl=nxType][v\\:format=switch1]');

    allSwitches.forEach(async (switchXStatus) => {
      try {
        const parentElm = switchXStatus.parentElement.parentElement;
        // get the element on which the DOM manipulation will be applied

        const closedVariableName = this.getVisioPropertyValue(parentElm, 'nxVariableClosed');

        const isClosed = this.getCachedDigitalValue(closedVariableName);

        // open line for the visio template variable
        const openVariableName = this.getVisioPropertyValue(parentElm, 'nxVariableOpen');

        const isOpen = this.getCachedDigitalValue(openVariableName);

        // open line
        const switchOpenLine = this.findElementByVisioReference(parentElm, 'open_line');
        if (switchOpenLine) {
          switchOpenLine.style = !isClosed ? 'fill: red; stroke-width: 0.75' : 'display: none';
        }
        // closed line
        const switchClosedLine = this.findElementByVisioReference(parentElm, 'closed_line');
        if (switchClosedLine) {
          switchClosedLine.style = isClosed ? 'stroke-opacity: 1; stroke-width: 0.75' : 'display: none';
        }

        // Title (mouseover) text
        this.setInnerHTML(parentElm, 'status', 'title', closedVariableName);

        const switchSquareElement = this.findElementByVisioReference(parentElm, 'status');
        if (switchSquareElement) {

          const showStatus = this.getVisioPropertyValue(parentElm, 'showStatus');

          if (showStatus === 'true') {
            switchSquareElement.style = isClosed ? 'fill: green' : 'fill: gray';
          } else {
            switchSquareElement.style = 'display: none';
          }
        }
      } catch (err) {
        console.debug('Could not find svg component!!!!', err);
      }
    });
      // Device status from SVG
    const allBinaryStatuses = this.dataContainer.nativeElement.querySelectorAll('[v\\:lbl=nxType][v\\:format=binaryStatus]');

    allBinaryStatuses.forEach((binaryStatus) => {
      try {
        const parentElm = binaryStatus.parentElement.parentElement;

        const variableName = this.getVisioPropertyValue(parentElm, 'nxVariable');
        const binaryStatusLabel = this.findElementByVisioReference(parentElm, 'label', 'text');

        if (binaryStatusLabel) {
          this.getVariableDescription(variableName).then((value) => {
            binaryStatusLabel.innerHTML = value;
          });
        }

        // Title (mouseover) text
        this.setInnerHTML(parentElm, 'status', 'title', variableName);

        const squareElement = this.findElementByVisioReference(parentElm, 'status', 'rect');
        if (squareElement) {
          squareElement.style = this.getCachedDigitalValue(variableName) ? 'fill: green' : 'fill: gray';
        }
      } catch (err) {
        console.debug('Could not find svg component!!!!', err);
      }
    });
      // Analogstatus from SVG templates and future devices
    const allAnalogValues = this.dataContainer.nativeElement.querySelectorAll('[v\\:lbl=nxType][v\\:format=analogvalue]');

    allAnalogValues.forEach((analogValue) => {

      try {
        // get the element on which the DOM manipulation will be applied
        const parentElm = analogValue.parentElement.parentElement;

        const variableName = this.getVisioPropertyValue(parentElm, 'nxVariable');
        const analogValueText = this.findElementByVisioReference(parentElm, 'label', 'text');

        // Analog Text
        if (analogValueText) {
          this.getVariableDescription(variableName).then((value) => {
            analogValueText.innerHTML = value;
          })
        }

        // Title (mouseover) text
        this.setInnerHTML(parentElm, 'value', 'title', variableName);

        // Analog Value
        const analogValueNumber = this.findElementByVisioReference(parentElm, 'value', 'text');

        if (analogValueNumber) {
          analogValueNumber.innerHTML = this.getCachedAnalogValue(variableName, 2, true);
        }

      } catch (err) {
        console.debug('Could not find svg component [analogvalue]!!!!', err);
      }
    });
  }

  // Generate a random boolean. Useful when random data is required
  getVariableValue(name?: string): boolean {
    // simulate a serve value by generating a random true/false value
    return Math.random() > 0.5;
  }

  // Generate a random number with given precision (decimal places). Useful when random data is required
  getVariableAnalogValue(name: string, precision = 2): string {
    const precisionNumber = Math.random() * 100;
    return precisionNumber.toFixed(precision);
  }

  // Get the latest analog value by variable name, also can be use to change the amount of units to be showed
  getCachedAnalogValue(name: string, precision = 2, showUnit = true): string {
    this.addUniqueVariableReference(name);
    if (this.dataCache[name]) {
      const value = this.dataCache[name].value.toFixed(precision);

      const unit = showUnit ? (this.dataCache[name].unit || '') : '';
      return `${value}${unit}`;
    }
    return '???';
  }

  // Get the latest diginal value by variable name
  getCachedDigitalValue(name: string): boolean {
    this.addUniqueVariableReference(name);
    if (this.dataCache[name]) {
      const value = this.dataCache[name].value;
      return !(value <= 0.0001 && value >= -0.0001);
    }
    return false;
  }

  // Get variable description text
  async getVariableDescription(name: string): Promise<string> {
    return this.dataService.getDatapointLabel(name, this.currentDevice.dtd);
  }

  onDeviceSelected(device: DeviceReference) {
    this.selectedDevice = device;
    this.deviceID = device.id;

    this.changeDeviceSubscriptions();
  }
  onDeviceTypeSelected(deviceType: string) {
    this.deviceTypeFilter = deviceType;
    this.updateDeviceList();
  }


}
