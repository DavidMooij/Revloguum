# Revloguum

Revloguum is a local-first vehicle journal for tracking maintenance, fuel, recurring payments, documents, and ownership costs without requiring an account or application backend.

## Screenshots

<table>
	<tr>
		<td align="center" width="33%">
			<img src="assets/screenshots/dashboard.jpg" width="240" alt="Dashboard with vehicle status, last fuel entry, and upcoming tasks"><br>
			<strong>Dashboard</strong><br>
			<sub>Last fuel entry, due services, payments, and quick fuel access.</sub>
		</td>
		<td align="center" width="33%">
			<img src="assets/screenshots/garage.jpg" width="240" alt="Garage with vehicle photo, odometer, and navigation tiles"><br>
			<strong>Garage</strong><br>
			<sub>Swipe between vehicles and open service, fuel, payment, or statistics views.</sub>
		</td>
		<td align="center" width="33%">
			<img src="assets/screenshots/service-history.jpg" width="240" alt="Filterable service history with an add button"><br>
			<strong>Service history</strong><br>
			<sub>Search and filter maintenance records, notes, costs, and service types.</sub>
		</td>
	</tr>
	<tr>
		<td align="center">
			<img src="assets/screenshots/payment-history.jpg" width="240" alt="Payment history with totals and document actions"><br>
			<strong>Payment history</strong><br>
			<sub>Review ownership costs and attach receipts or multi-page documents.</sub>
		</td>
		<td align="center" width="33%">
			<img src="assets/screenshots/statistics.jpg" width="240" alt="Vehicle statistics with metrics and cost charts"><br>
			<strong>Statistics</strong><br>
			<sub>Compare fuel, mileage, service, payment, and cost trends.</sub>
		</td>
		<td align="center" width="33%">
			<img src="assets/screenshots/settings.jpg" width="240" alt="Settings with exports, type management, and preferences"><br>
			<strong>Settings</strong><br>
			<sub>Manage types, protected backups, PDF reports, reminders, and accessibility.</sub>
		</td>
	</tr>
</table>

Screenshots show the English interface. Revloguum also includes a complete German interface. Vehicle photos and values shown here are demonstration data.

## Features

- Manage multiple motorcycles, cars, and other vehicles
- Record individual services or grouped workshop visits with notes and photos
- Track fuel entries, consumption, prices, and mileage
- Track one-time costs and recurring payment intervals
- Configure service and payment reminders as local notifications
- Store multi-page vehicle, service, and payment documents from camera or gallery
- Review cost, fuel, mileage, service, and tyre statistics
- Generate configurable vehicle reports as PDF
- Export and restore password-protected backups
- Switch between English and German
- Use the optional Clear View readability mode

The complete functional behavior and known calculation limits are documented in [USECASES.md](USECASES.md).

## Privacy and Security

Core vehicle data is stored on the device. Revloguum has no account system and the application code does not send personal vehicle data to a Revloguum backend or analytics service.

- The project configures SQLite to use SQLCipher.
- The source code attempts to encrypt managed persistent photos and document pages.
- The backup implementation is designed to use password-based authenticated encryption.
- PDF reports are not encrypted and may contain sensitive information.
- Sharing a PDF or backup sends it to a destination chosen through the operating system.

See [SECURITY.md](SECURITY.md) for data handling, permissions, the threat model, implementation details, limitations, and vulnerability reporting. These mechanisms have not been independently audited and are not security guarantees.

## Technology

- React Native 0.86 and React 19
- Expo SDK 57
- TypeScript
- Expo SQLite with SQLCipher
- React Navigation
- Zustand
- i18next

The code is organized as `domain -> data -> hooks -> screens`. Persistence belongs in SQLite repositories, shared application state belongs in Zustand, and navigation belongs in React Navigation.

## Development

### Platform status

Revloguum is developed primarily for Android and the current application flows have been tested there. iOS support is configured in the project, but the app has not yet been tested on an Apple device or iOS simulator. iOS behavior, layout, permissions, notifications, encryption integration, backup/restore, and PDF sharing may therefore differ or require additional work.

### Prerequisites

- Node.js and npm supported by the installed Expo SDK
- Android Studio and an Android SDK for Android development
- macOS with Xcode for iOS development
- A simulator/emulator or physical development device

Revloguum uses native modules including SQLCipher and platform key storage. Use a native development build; Expo Go is not a supported runtime for the complete app.

### Install and run

```bash
npm ci
npx expo run:android
```

On macOS, `npx expo run:ios` starts the currently unverified iOS development build. `npm start` starts the Expo development server for an already installed compatible development build.

Fork maintainers should replace the Expo owner/project ID, Android package name, and iOS bundle identifier in [app.json](app.json) before publishing builds under their own identity. Build profiles are defined in [eas.json](eas.json).

### Validation

```bash
./node_modules/.bin/tsc --noEmit --pretty false
git diff --check
```

There is currently no automated test suite. Security-sensitive and user-facing changes require focused manual testing on the affected mobile platforms; the checklist is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

- [USECASES.md](USECASES.md): detailed functional use cases and limitations
- [SECURITY.md](SECURITY.md): privacy, data handling, security model, limitations, and reporting process
- [CONTRIBUTING.md](CONTRIBUTING.md): setup, architecture, coding rules, and validation
- [.github/copilot-instructions.md](.github/copilot-instructions.md): project-wide coding-agent guidance

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before making changes. Report security vulnerabilities privately according to [SECURITY.md](SECURITY.md), not in a public issue.

## Acknowledgements

Development was assisted by AI tools including GitHub Copilot, ChatGPT, and Claude.

## Disclaimer

**This software is provided "as is", without warranty of any kind. Use it at your own risk.**

Revloguum's reminders, calculations, reports, stored records, and documentation may be incomplete, outdated, or incorrect and do not replace professional mechanical, legal, insurance, tax, or financial advice. Markdown files in this repository describe intended or observed behavior but are not a binding guarantee that the software behaves exactly as documented. To the maximum extent permitted by applicable law, the authors and contributors are not liable for damages, data loss, missed maintenance, missed payments, or other consequences arising from use of the software or its documentation. See the [MIT License](LICENSE) for the full warranty and liability terms.

## License

Revloguum is licensed under the [MIT License](LICENSE).